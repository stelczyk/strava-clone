import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'
import L from 'leaflet'
import {
  fetchActivities, fetchActivity, uploadActivity, fetchRecords, fetchWeekly,
  login, register, logout, getToken,
  type ActivityListItem, type Activity, type TrackPoint, type PersonalRecords, type WeeklyStat,
} from './api'

function LoginScreen({ onAuthed }: { onAuthed: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mode === 'register') await register(username, password)
      await login(username, password)
      onAuthed()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <form className="auth-card" onSubmit={submit}>
        <h1 className="wordmark">TrainLog</h1>
        <p className="auth-title">{mode === 'login' ? 'Zaloguj się' : 'Załóż konto'}</p>
        <input placeholder="login" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input type="password" placeholder="hasło" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit" disabled={busy}>
          {busy ? '...' : mode === 'login' ? 'Zaloguj' : 'Zarejestruj'}
        </button>
        <button type="button" className="auth-switch" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Nie masz konta? Zarejestruj się' : 'Masz konto? Zaloguj się'}
        </button>
      </form>
    </div>
  )
}

const HR_MAX = 195
const ZONE_BOUNDS = [0.6, 0.7, 0.8, 0.9]
const ZONE_COLORS = ['#1f6f5c', '#7fae3a', '#e0a92e', '#e5722b', '#e1274c']

function hrZones(samples: TrackPoint[]): number[] {
  const zones = [0, 0, 0, 0, 0]
  for (let i = 1; i < samples.length; i++) {
    const prev = samples[i - 1]
    const cur = samples[i]
    if (prev.hr == null) continue
    const dt = (cur.t - prev.t) / 1000
    const pct = prev.hr / HR_MAX
    const z = ZONE_BOUNDS.filter((b) => pct >= b).length
    zones[z] += dt
  }
  return zones
}

type Split = { distanceKm: number; seconds: number }

function splits(samples: TrackPoint[]): Split[] {
  const pts = samples.filter((s): s is TrackPoint & { dist: number } => s.dist != null)
  if (pts.length < 2) return []

  const out: Split[] = []
  let target = 1000
  let prevMark = pts[0].t

  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1]
    const cur = pts[i]
    while (cur.dist >= target) {
      const frac = (target - prev.dist) / (cur.dist - prev.dist)
      const cross = prev.t + frac * (cur.t - prev.t)
      out.push({ distanceKm: 1, seconds: (cross - prevMark) / 1000 })
      prevMark = cross
      target += 1000
    }
  }

  const last = pts[pts.length - 1]
  const leftover = last.dist - (target - 1000)
  if (leftover > 1) {
    out.push({ distanceKm: leftover / 1000, seconds: (last.t - prevMark) / 1000 })
  }

  return out
}

function fmtDuration(sec: number | null): string {
  if (sec == null) return '?'
  const s = Math.round(sec)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
    : `${m}:${String(ss).padStart(2, '0')}`
}

function fmtPace(distM: number | null, sec: number | null): string {
  if (!distM || !sec) return '?'
  const p = sec / (distM / 1000)
  return `${Math.floor(p / 60)}:${String(Math.round(p % 60)).padStart(2, '0')}`
}

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function elevationGain(samples: { alt: number | null }[]): number {
  let gain = 0
  for (let i = 1; i < samples.length; i++) {
    const prev = samples[i - 1].alt
    const cur = samples[i].alt
    if (prev != null && cur != null && cur - prev > 1) gain += cur - prev
  }
  return Math.round(gain)
}

function Metric({ value, unit, label, accent }: {
  value: string | number
  unit?: string
  label: string
  accent?: boolean
}) {
  return (
    <div className={accent ? 'metric accent' : 'metric'}>
      <div className="value">{value}{unit && <span className="unit">{unit}</span>}</div>
      <div className="label">{label}</div>
    </div>
  )
}

function TrackMap({ points }: { points: [number, number][] }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current || points.length === 0) return
    const map = L.map(ref.current).fitBounds(points)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map)
    L.polyline(points, { color: '#1f6f5c', weight: 4 }).addTo(map)
    return () => { map.remove() }
  }, [points])
  return <div ref={ref} className="map" />
}

const SPORT_COLORS: Record<string, string> = {
  running: '#1f6f5c', cycling: '#3b7dd8', hiking: '#e0a92e', swimming: '#26b3c9',
  training: '#8a5cf6', fitness_equipment: '#8a5cf6',
}
const SPORT_LABELS: Record<string, string> = {
  running: 'bieganie', cycling: 'rower', hiking: 'góry', swimming: 'pływanie',
  training: 'siłownia', fitness_equipment: 'siłownia',
}
const SPORT_ORDER = ['running', 'cycling', 'hiking', 'swimming', 'training', 'fitness_equipment']
const rank = (s: string) => { const i = SPORT_ORDER.indexOf(s); return i === -1 ? 99 : i }
const sportLabel = (s: string) => SPORT_LABELS[s] ?? s

export default function App() {
  const [authed, setAuthed] = useState(!!getToken())
  const [activities, setActivities] = useState<ActivityListItem[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [sport, setSport] = useState('')
  const [selected, setSelected] = useState<Activity | null>(null)
  const [records, setRecords] = useState<PersonalRecords | null>(null)
  const [weekly, setWeekly] = useState<WeeklyStat[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load(p = page, s = sport) {
    try {
      const res = await fetchActivities(p, s || undefined)
      setActivities(res.items)
      setTotalPages(res.totalPages)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function loadRecords() {
    try {
      setRecords(await fetchRecords())
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function loadWeekly() {
    try {
      setWeekly(await fetchWeekly())
    } catch (e) {
      setError((e as Error).message)
    }
  }

  useEffect(() => { if (authed) { loadRecords(); loadWeekly() } }, [authed])
  useEffect(() => { if (authed) load() }, [authed, page, sport])

  function onLogout() {
    logout()
    setSelected(null)
    setActivities([])
    setRecords(null)
    setWeekly([])
    setAuthed(false)
  }

  async function onUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      await uploadActivity(file)
      setPage(0)
      await load(0, sport)
      await loadRecords()
      await loadWeekly()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  async function onSelect(id: number) {
    setError(null)
    try {
      setSelected(await fetchActivity(id))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const chartData = selected?.samples.map((s) => ({
    min: (s.t - selected.samples[0].t) / 60000,
    hr: s.hr,
  }))

  const track = selected?.samples
    .filter((s) => s.lat != null && s.lng != null)
    .map((s) => [s.lat!, s.lng!] as [number, number])

  const weekMap = new Map<string, Record<string, number | string>>()
  for (const w of weekly) {
    const row = weekMap.get(w.weekStart) ?? {
      label: new Date(w.weekStart).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' }),
    }
    row[w.sport] = Math.round(w.timeSeconds / 60)
    if (w.distanceMeters && w.distanceMeters > 0) {
      row[`${w.sport}__km`] = Number((w.distanceMeters / 1000).toFixed(1))
    }
    weekMap.set(w.weekStart, row)
  }
  const weeklyData = [...weekMap.values()]
  const sportsPresent = [...new Set(weekly.map((w) => w.sport))].sort((a, b) => rank(a) - rank(b))

  const splitData = selected ? splits(selected.samples) : []
  const fullTimes = splitData.filter((s) => s.distanceKm === 1).map((s) => s.seconds)
  const fastest = fullTimes.length ? Math.min(...fullTimes) : 0
  const slowest = fullTimes.length ? Math.max(...fullTimes) : 0

  const zoneData = selected
    ? hrZones(selected.samples).map((sec, i) => ({ zone: `Z${i + 1}`, sec }))
    : []

  if (!authed) {
    return <LoginScreen onAuthed={() => setAuthed(true)} />
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="wordmark" onClick={() => setSelected(null)}>TrainLog</h1>
        <div className="topbar-actions">
          <label className="btn">
            {busy ? 'Wgrywanie…' : '+ Wgraj .fit'}
            <input type="file" accept=".fit" onChange={onUpload} disabled={busy} hidden />
          </label>
          <button className="logout" onClick={onLogout}>Wyloguj</button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      <div className="layout">
        <aside>
          <p className="side-title">Aktywności</p>
          <select className="sport-filter" value={sport} onChange={(e) => { setSport(e.target.value); setPage(0) }}>
            <option value="">wszystkie sporty</option>
            <option value="running">bieganie</option>
            <option value="cycling">rower</option>
            <option value="hiking">wędrówka</option>
            <option value="swimming">pływanie</option>
          </select>
          {activities.length === 0 ? (
            <p className="empty">Brak aktywności. Wgraj pierwszy plik .fit.</p>
          ) : (
            <>
              <ul className="act-list">
                {activities.map((a) => (
                  <li key={a.id}>
                    <button
                      className={selected?.id === a.id ? 'act active' : 'act'}
                      onClick={() => onSelect(a.id)}
                    >
                      <div className="sport">{sportLabel(a.sport)}</div>
                      <div className="meta">
                        {a.distanceMeters ? (a.distanceMeters / 1000).toFixed(2) : '?'} km
                        {a.startTime && ` - ${fmtDate(a.startTime)}`}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              {totalPages > 1 && (
                <div className="pager">
                  <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>←</button>
                  <span>{page + 1} / {totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>→</button>
                </div>
              )}
            </>
          )}
        </aside>

        <main>
          {!selected || !chartData ? (
            <div>
              {records && (
                <>
                  <p className="side-title">Rekordy (bieg)</p>
                  <div className="metrics">
                    {records.bestEfforts.map((e) => (
                      <Metric
                        key={e.distanceMeters}
                        value={e.timeMillis != null ? fmtDuration(e.timeMillis / 1000) : '-'}
                        label={`${e.distanceMeters / 1000} km`}
                      />
                    ))}
                    <Metric
                      value={records.longestRunMeters != null ? (records.longestRunMeters / 1000).toFixed(2) : '-'}
                      unit="km"
                      label="najdłuższy"
                    />
                  </div>
                </>
              )}
              {weekly.length > 0 && (
                <div className="panel">
                  <h3>Ostatnie tygodnie</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={weeklyData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                      <CartesianGrid stroke="#eef0ee" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} label={{ value: 'czas [min]', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                      <Tooltip formatter={(v, n, item) => {
                        const mins = Number(v)
                        const time = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}min` : `${mins} min`
                        const km = (item?.payload as Record<string, number>)?.[`${n}__km`]
                        return [km ? `${time} (${km} km)` : time, SPORT_LABELS[n as string] ?? n]
                      }} />
                      <Legend formatter={(v) => SPORT_LABELS[v as string] ?? v} />
                      {sportsPresent.map((s) => (
                        <Bar key={s} dataKey={s} stackId="a" fill={SPORT_COLORS[s] ?? '#999'} name={s} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <p className="empty">Wybierz aktywność z listy, żeby zobaczyć szczegóły.</p>
            </div>
          ) : (
            <>
              <div className="detail-head">
                <h2>{sportLabel(selected.sport)}</h2>
                <span className="date">{fmtDate(selected.startTime)}</span>
              </div>

              <div className="metrics">
                <Metric value={selected.totalDistanceMeters ? (selected.totalDistanceMeters / 1000).toFixed(2) : '?'} unit="km" label="dystans" />
                <Metric value={fmtPace(selected.totalDistanceMeters, selected.totalElapsedSeconds)} unit="/km" label="tempo" />
                <Metric value={fmtDuration(selected.totalElapsedSeconds)} label="czas" />
                <Metric value={selected.avgHeartRate ?? '?'} unit="bpm" label="tętno" accent />
                <Metric value={elevationGain(selected.samples)} unit="m" label="przewyższenie" />
              </div>

              {splitData.length > 0 && (
                <div className="splits">
                  <h3>Splity</h3>
                  <table>
                    <tbody>
                      {splitData.map((s, i) => {
                        const partial = s.distanceKm < 1
                        const pace = s.seconds / s.distanceKm
                        const width = `${Math.min(100, (fastest / pace) * 100)}%`
                        const cls = partial ? 'split partial'
                          : s.seconds === fastest ? 'split fast'
                          : s.seconds === slowest ? 'split slow'
                          : 'split'
                        return (
                          <tr key={i} className={cls}>
                            <td className="km">{partial ? s.distanceKm.toFixed(2) : i + 1}</td>
                            <td className="bar-cell"><span className="bar" style={{ width }} /></td>
                            <td className="pace">{fmtPace(s.distanceKm * 1000, s.seconds)}<span className="unit"> /km</span></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="panels">
                <div className="panel">
                  <h3>Tętno</h3>
                  <ResponsiveContainer width="100%" height={380}>
                    <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 24, left: 8 }}>
                      <CartesianGrid stroke="#eef0ee" />
                      <XAxis dataKey="min" tick={{ fontSize: 12 }} tickFormatter={(v) => `${Math.round(v)}`} label={{ value: 'czas [min]', position: 'insideBottom', offset: -12, fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} label={{ value: 'tętno [bpm]', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                      <Tooltip labelFormatter={(v) => `${Math.round(Number(v))} min`} />
                      <Legend verticalAlign="top" />
                      <Line dataKey="hr" stroke="#e1274c" strokeWidth={2} dot={false} name="tętno" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {track && track.length > 0 && (
                  <div className="panel">
                    <h3>Trasa</h3>
                    <TrackMap points={track} />
                  </div>
                )}
                <div className="panel">
                  <h3>Strefy tętna</h3>
                  <ResponsiveContainer width="100%" height={380}>
                    <BarChart data={zoneData} margin={{ top: 8, right: 8, bottom: 24, left: 8 }}>
                      <CartesianGrid stroke="#eef0ee" vertical={false} />
                      <XAxis dataKey="zone" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => fmtDuration(v)} width={54} />
                      <Tooltip formatter={(v) => fmtDuration(Number(v))} />
                      <Bar dataKey="sec" name="czas">
                        {zoneData.map((_, i) => <Cell key={i} fill={ZONE_COLORS[i]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

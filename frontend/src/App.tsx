import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'
import L from 'leaflet'
import {
  fetchActivities, fetchActivity, uploadActivity,
  type ActivityListItem, type Activity,
} from './api'

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

export default function App() {
  const [activities, setActivities] = useState<ActivityListItem[]>([])
  const [selected, setSelected] = useState<Activity | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      setActivities(await fetchActivities())
    } catch (e) {
      setError((e as Error).message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function onUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      await uploadActivity(file)
      await load()
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

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="wordmark">TrainLog</h1>
        <label className="btn">
          {busy ? 'Wgrywanie…' : '+ Wgraj .fit'}
          <input type="file" accept=".fit" onChange={onUpload} disabled={busy} hidden />
        </label>
      </header>

      {error && <p className="error">{error}</p>}

      <div className="layout">
        <aside>
          <p className="side-title">Aktywności</p>
          {activities.length === 0 ? (
            <p className="empty">Brak aktywności. Wgraj pierwszy plik .fit.</p>
          ) : (
            <ul className="act-list">
              {activities.map((a) => (
                <li key={a.id}>
                  <button
                    className={selected?.id === a.id ? 'act active' : 'act'}
                    onClick={() => onSelect(a.id)}
                  >
                    <div className="sport">{a.sport}</div>
                    <div className="meta">
                      {a.distanceMeters ? (a.distanceMeters / 1000).toFixed(2) : '?'} km
                      {a.startTime && ` - ${fmtDate(a.startTime)}`}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main>
          {!selected || !chartData ? (
            <p className="empty">Wybierz aktywność z listy, żeby zobaczyć szczegóły.</p>
          ) : (
            <>
              <div className="detail-head">
                <h2>{selected.sport}</h2>
                <span className="date">{fmtDate(selected.startTime)}</span>
              </div>

              <div className="metrics">
                <Metric value={selected.totalDistanceMeters ? (selected.totalDistanceMeters / 1000).toFixed(2) : '?'} unit="km" label="dystans" />
                <Metric value={fmtPace(selected.totalDistanceMeters, selected.totalElapsedSeconds)} unit="/km" label="tempo" />
                <Metric value={fmtDuration(selected.totalElapsedSeconds)} label="czas" />
                <Metric value={selected.avgHeartRate ?? '?'} unit="bpm" label="tętno" accent />
                <Metric value={elevationGain(selected.samples)} unit="m" label="przewyższenie" />
              </div>

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
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

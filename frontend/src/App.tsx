import { useEffect, useState, type ChangeEvent } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import {
  fetchActivities, fetchActivity, uploadActivity,
  type ActivityListItem, type Activity,
} from './api'

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
    alt: s.alt,
  }))

  return (
    <main style={{ maxWidth: 700, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <h1>TrainLog</h1>

      <input type="file" accept=".fit" onChange={onUpload} disabled={busy} />
      {busy && <p>Wgrywanie…</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <ul>
        {activities.map((a) => (
          <li key={a.id} onClick={() => onSelect(a.id)} style={{ cursor: 'pointer' }}>
            {a.sport} — {a.distanceMeters ? (a.distanceMeters / 1000).toFixed(2) : '?'} km
            {a.startTime && ` — ${new Date(a.startTime).toLocaleDateString()}`}
          </li>
        ))}
      </ul>

      {selected && chartData && (
        <section>
          <h2>{selected.sport} — próbki: {selected.samples.length}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="min" unit=" min" />
              <YAxis yAxisId="hr" />
              <YAxis yAxisId="alt" orientation="right" />
              <Tooltip />
              <Line yAxisId="hr" dataKey="hr" stroke="crimson" dot={false} name="tętno" />
              <Line yAxisId="alt" dataKey="alt" stroke="steelblue" dot={false} name="wysokość" />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}
    </main>
  )
}

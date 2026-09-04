import { useEffect, useState, type ChangeEvent } from 'react'
import { fetchActivities, uploadActivity, type ActivityListItem } from './api'

export default function App() {
  const [activities, setActivities] = useState<ActivityListItem[]>([])
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

  return (
    <main style={{ maxWidth: 700, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <h1>TrainLog</h1>

      <input type="file" accept=".fit" onChange={onUpload} disabled={busy} />
      {busy && <p>Wgrywanie…</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <ul>
        {activities.map((a) => (
          <li key={a.id}>
            {a.sport} — {a.distanceMeters ? (a.distanceMeters / 1000).toFixed(2) : '?'} km
            {a.startTime && ` — ${new Date(a.startTime).toLocaleDateString()}`}
          </li>
        ))}
      </ul>
    </main>
  )
}

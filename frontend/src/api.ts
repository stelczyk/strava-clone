const API = import.meta.env.VITE_API_URL ?? '/api'

export type ActivityListItem = {
  id: number
  sport: string
  startTime: string | null
  distanceMeters: number | null
  elapsedSeconds: number | null
  avgHeartRate: number | null
}

export async function fetchActivities(): Promise<ActivityListItem[]> {
  const res = await fetch(`${API}/activities`)
  if (!res.ok) throw new Error('Nie udało się pobrać listy')
  return res.json()
}

export async function uploadActivity(file: File): Promise<void> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API}/activities`, { method: 'POST', body: form })
  if (!res.ok) throw new Error('Upload nie powiódł się')
}

export type TrackPoint = {
  t: number
  lat: number | null
  lng: number | null
  hr: number | null
  alt: number | null
  spd: number | null
  dist: number | null
}


export type Activity = {
  id: number
  sport: string
  startTime: string | null
  totalDistanceMeters: number | null
  totalElapsedSeconds: number | null
  avgHeartRate: number | null
  samples: TrackPoint[]
}

export async function fetchActivity(id: number): Promise<Activity> {
  const res = await fetch(`${API}/activities/${id}`)
  if (!res.ok) throw new Error('Nie udało się pobrać treningu')
  return res.json()
}

export type BestEffort = { distanceMeters: number; timeMillis: number | null }
export type PersonalRecords = { bestEfforts: BestEffort[]; longestRunMeters: number | null }

export async function fetchRecords(): Promise<PersonalRecords> {
  const res = await fetch(`${API}/records`)
  if (!res.ok) throw new Error('Nie udało się pobrać rekordów')
  return res.json()
}

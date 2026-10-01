const API = import.meta.env.VITE_API_URL ?? '/api'

const TOKEN_KEY = 'trainlog_token'

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}

export function logout() {
  try { localStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ }
}

function authHeaders(): Record<string, string> {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export async function login(username: string, password: string): Promise<void> {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new Error('Błędny login lub hasło')
  const data = await res.json()
  try { localStorage.setItem(TOKEN_KEY, data.token) } catch { /* ignore */ }
}

export async function register(username: string, password: string): Promise<void> {
  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new Error(res.status === 409 ? 'Login zajęty' : 'Rejestracja nie powiodła się')
}

export type ActivityListItem = {
  id: number
  sport: string
  startTime: string | null
  distanceMeters: number | null
  elapsedSeconds: number | null
  avgHeartRate: number | null
}

export async function fetchActivities(): Promise<ActivityListItem[]> {
  const res = await fetch(`${API}/activities`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Nie udało się pobrać listy')
  return res.json()
}

export async function uploadActivity(file: File): Promise<void> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API}/activities`, { method: 'POST', headers: authHeaders(), body: form })
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
  const res = await fetch(`${API}/activities/${id}`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Nie udało się pobrać treningu')
  return res.json()
}

export type BestEffort = { distanceMeters: number; timeMillis: number | null }
export type PersonalRecords = { bestEfforts: BestEffort[]; longestRunMeters: number | null }

export async function fetchRecords(): Promise<PersonalRecords> {
  const res = await fetch(`${API}/records`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Nie udało się pobrać rekordów')
  return res.json()
}

export type ActivityListItem = {
  id: number
  sport: string
  startTime: string | null
  distanceMeters: number | null
  elapsedSeconds: number | null
  avgHeartRate: number | null
}

export async function fetchActivities(): Promise<ActivityListItem[]> {
  const res = await fetch('/api/activities')
  if (!res.ok) throw new Error('Nie udało się pobrać listy')
  return res.json()
}

export async function uploadActivity(file: File): Promise<void> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/activities', { method: 'POST', body: form })
  if (!res.ok) throw new Error('Upload nie powiódł się')
}

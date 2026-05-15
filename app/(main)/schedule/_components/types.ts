export type EventItem = {
  id: string
  date: string
  title: string
  description?: string | null
  startTime?: string | null
  endTime?: string | null
  category?: string | null
  color: string
  studyGroupId?: string | null
  studyGroupName?: string | null
  creatorId?: string | null
  creatorName?: string | null
}

export type ApiEvent = {
  id: string
  title: string
  description: string | null
  date: string
  startTime: string | null
  endTime: string | null
  category: string | null
  studyGroupId?: string | null
  studyGroup?: { id: string; name: string } | null
  userId?: string
  user?: { id: string; name: string | null } | null
}

const CATEGORY_TO_COLOR: Record<string, string> = {
  math: 'bg-blue-500',
  physics: 'bg-emerald-500',
  cs: 'bg-purple-500',
  chemistry: 'bg-amber-500',
  biology: 'bg-rose-500',
}

function colorFromCategory(category: string | null): string {
  if (!category) return 'bg-blue-500'
  return CATEGORY_TO_COLOR[category.toLowerCase()] ?? 'bg-blue-500'
}

export function formatEventTime(startTime?: string | null, endTime?: string | null): string {
  if (!startTime || !endTime) return ''
  return `${startTime} - ${endTime}`
}

export function mapApiEvent(event: ApiEvent): EventItem {
  const isStoredColor = event.category?.startsWith('bg-') ?? false
  return {
    id: event.id,
    date: new Date(event.date).toISOString().slice(0, 10),
    title: event.title,
    description: event.description,
    startTime: event.startTime,
    endTime: event.endTime,
    category: event.category,
    color: isStoredColor ? event.category! : colorFromCategory(event.category),
    studyGroupId: event.studyGroupId ?? null,
    studyGroupName: event.studyGroup?.name ?? null,
    creatorId: event.userId ?? null,
    creatorName: event.user?.name ?? null,
  }
}

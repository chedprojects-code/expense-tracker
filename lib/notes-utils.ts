import { formatLocalDate, parseLocalDate } from '@/lib/date-utils'

export type NoteDueStatus = 'overdue' | 'today' | 'soon' | 'later' | 'none'

export function parseNoteTags(value: string): string[] {
  const seen = new Set<string>()
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => {
      const key = tag.toLocaleLowerCase()
      if (!tag || seen.has(key)) return false
      seen.add(key)
      return true
    })
}

export function getNoteDueStatus(dueDate: string | null | undefined, today = formatLocalDate()): NoteDueStatus {
  if (!dueDate) return 'none'
  const daysUntil = Math.round(
    (parseLocalDate(dueDate).getTime() - parseLocalDate(today).getTime()) / 86_400_000
  )
  if (daysUntil < 0) return 'overdue'
  if (daysUntil === 0) return 'today'
  if (daysUntil <= 7) return 'soon'
  return 'later'
}

export function getNoteDueLabel(dueDate: string): string {
  const status = getNoteDueStatus(dueDate)
  const daysUntil = Math.round(
    (parseLocalDate(dueDate).getTime() - parseLocalDate(formatLocalDate()).getTime()) / 86_400_000
  )
  if (status === 'overdue') return `Overdue by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? '' : 's'}`
  if (status === 'today') return 'Due today'
  if (status === 'soon') return `Due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`
  return `Due ${parseLocalDate(dueDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}`
}

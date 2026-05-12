import type { Book } from './book'

export type BookStatus = 'pending' | 'abandoned' | 'in-progress' | 'finished'

export function getStatus(book: Book): BookStatus {
  if (book.readings.length === 0) return 'pending'
  const last = book.readings[book.readings.length - 1]
  if (!last.endDate) return 'in-progress'
  if (book.readings.some((r) => r.completed)) return 'finished'
  return 'abandoned'
}

export const STATUS_LABEL: Record<BookStatus, string> = {
  pending: 'Pendiente',
  abandoned: 'Abandonado',
  'in-progress': 'En progreso',
  finished: 'Finalizado'
}

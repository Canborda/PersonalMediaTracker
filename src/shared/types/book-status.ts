import type { Book } from './book'

export type BookStatus = 'pending' | 'abandoned' | 'in-progress' | 'finished'

export function getStatus(book: Book): BookStatus {
  if (book.abandoned) return 'abandoned'
  if (!book.startDate) return 'pending'
  if (book.endDate) return 'finished'
  return 'in-progress'
}

export const STATUS_LABEL: Record<BookStatus, string> = {
  pending: 'Pendiente',
  abandoned: 'Abandonado',
  'in-progress': 'En progreso',
  finished: 'Finalizado'
}

import type { Book } from './book'

export type BookStatus = 'pending' | 'abandoned' | 'in-progress' | 'finished'

export function getStatus(book: Book): BookStatus {
  if (!book.startDate) return book.abandoned ? 'abandoned' : 'pending'
  if (book.endDate) return 'finished'
  return 'in-progress'
}

export const STATUS_LABEL: Record<BookStatus, string> = {
  pending: 'Pendiente',
  abandoned: 'Abandonado',
  'in-progress': 'En progreso',
  finished: 'Finalizado'
}

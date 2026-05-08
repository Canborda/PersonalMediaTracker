export interface ReadSession {
  startDate: string
  endDate?: string
}

export interface Book {
  id: string
  title: string
  author: string
  year: number
  pages: number
  startDate?: string
  endDate?: string
  abandoned?: boolean
  rereads: ReadSession[]
}

export type BookStatus = 'pending' | 'abandonado' | 'in-progress' | 'finished'

export function getStatus(book: Book): BookStatus {
  if (!book.startDate) return book.abandoned ? 'abandonado' : 'pending'
  if (book.endDate) return 'finished'
  return 'in-progress'
}

export const STATUS_LABEL: Record<BookStatus, string> = {
  pending: 'Pendiente',
  abandonado: 'Abandonado',
  'in-progress': 'En progreso',
  finished: 'Finalizado'
}

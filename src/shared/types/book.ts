import type { BookCategory } from './book-category'

export interface ReadSession {
  startDate: string
  endDate?: string
}

export interface Book {
  id: string
  title: string
  author: string
  year: number
  isbn: string
  category: BookCategory
  startDate?: string
  endDate?: string
  abandoned?: boolean
  rereads: ReadSession[]
  pages?: number
  linesPerPage?: number
  score?: number
}

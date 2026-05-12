import type { BookCategory } from './book-category'

export interface Reading {
  startDate: string
  endDate?: string
  completed?: boolean
}

export interface Book {
  id: string
  title: string
  author: string
  year: number
  isbn: string
  category: BookCategory
  readings: Reading[]
  pages?: number
  linesPerPage?: number
  score?: number
}

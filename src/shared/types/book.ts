import type { BookGenre } from './book-genre'

export interface Reading {
  startDate: string
  endDate?: string
  completed?: boolean
}

export interface BookAdditionalData {
  originalTitle?: string
  originalLanguage?: string
  genre?: BookGenre
  pages?: number
  linesPerPage?: number
}

export interface Book {
  id: string
  title: string
  author: string
  year: number
  isbn: string
  readings: Reading[]
  additionalData: BookAdditionalData
  tags?: string[]
  score?: number
}

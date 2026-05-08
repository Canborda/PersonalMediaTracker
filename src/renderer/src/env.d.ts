/// <reference types="vite/client" />

import type { Book, BookMeta } from '../../shared/types'

export {}

declare global {
  interface Window {
    electron: {
      getBooks: () => Promise<Book[]>
      addBook: (book: Omit<Book, 'id'>) => Promise<Book[]>
      updateBook: (book: Book) => Promise<Book[]>
      deleteBook: (id: string) => Promise<Book[]>
      getDataDir: () => Promise<string>
      openDataDir: () => Promise<void>
      openSettings: () => Promise<void>
      getBookMeta: (id: string) => Promise<BookMeta | null>
      fetchBookMeta: (id: string) => Promise<BookMeta>
    }
  }
}

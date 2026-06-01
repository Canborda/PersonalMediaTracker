export const BOOK_GENRES = [
  'novel',
  'novella',
  'short-story',
  'poetry',
  'essay',
  'chronicle',
  'history',
  'philosophy',
  'memoir',
  'science',
  'self-help',
  'children-young-adult',
  'academic',
  'comics-graphic-novel',
  'other'
] as const

export type BookGenre = typeof BOOK_GENRES[number]

export const GENRE_LABEL: Record<BookGenre, string> = {
  'novel': 'Novela',
  'novella': 'Novela corta',
  'short-story': 'Cuento',
  'poetry': 'Poesía',
  'essay': 'Ensayo',
  'chronicle': 'Crónica',
  'history': 'Historia',
  'philosophy': 'Filosofía',
  'memoir': 'Memorias',
  'science': 'Ciencia',
  'self-help': 'Autoayuda',
  'children-young-adult': 'Infantil / Juvenil',
  'academic': 'Académico',
  'comics-graphic-novel': 'Cómic / Novela gráfica',
  'other': 'Otro'
}

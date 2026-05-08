export const BOOK_CATEGORIES = [
  'novel',
  'novella',
  'short-story',
  'poetry',
  'essay',
  'chronicle',
  'history',
  'philosophy',
  'biography',
  'science',
  'self-help',
  'children-young-adult',
  'academic',
  'comics-graphic-novel',
  'other'
] as const

export type BookCategory = typeof BOOK_CATEGORIES[number]

export const CATEGORY_LABEL: Record<BookCategory, string> = {
  'novel': 'Novela',
  'novella': 'Novela corta',
  'short-story': 'Cuento',
  'poetry': 'Poesía',
  'essay': 'Ensayo',
  'chronicle': 'Crónica',
  'history': 'Historia',
  'philosophy': 'Filosofía',
  'biography': 'Biografía',
  'science': 'Ciencia',
  'self-help': 'Autoayuda',
  'children-young-adult': 'Infantil / Juvenil',
  'academic': 'Académico',
  'comics-graphic-novel': 'Cómic / Novela gráfica',
  'other': 'Otro'
}

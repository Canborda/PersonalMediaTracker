import React, { useState, useEffect } from 'react'
import type { Book, BookMeta } from '../../../shared/types'
import { getStatus, STATUS_LABEL, CATEGORY_LABEL } from '../../../shared/types'

interface Props {
  book: Book
  onClick: () => void
}

function formatDate(date?: string): string {
  if (!date) return '—'
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

function formatAuthor(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return name
  const [first, ...rest] = parts
  return `${rest.join(' ')}, ${first}`
}

export default function BookCard({ book, onClick }: Props): React.JSX.Element {
  const [meta, setMeta] = useState<BookMeta | null>(null)

  useEffect(() => {
    window.electron.getBookMeta(book.id).then(setMeta)
  }, [book.id])

  const status = getStatus(book)

  return (
    <div className="book-card" onClick={onClick}>
      <div className="book-card-cover">
        {meta?.cover
          ? <img src={meta.cover} alt={book.title} />
          : <span className="book-card-cover-letter">{book.title[0]?.toUpperCase()}</span>
        }
      </div>
      <div className="book-card-info">
        <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>
        <p className="book-card-title">{book.title}</p>
        <p className="book-card-author">{formatAuthor(book.author)}</p>
        <p className="book-card-year">{book.year}</p>
        <p className="book-card-category">{CATEGORY_LABEL[book.category]}</p>
        {(book.startDate || book.endDate) && (
          <p className="book-card-dates">
            {formatDate(book.startDate)}{book.endDate ? ` → ${formatDate(book.endDate)}` : ''}
          </p>
        )}
      </div>
    </div>
  )
}

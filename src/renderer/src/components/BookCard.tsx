import React, { useState, useEffect } from 'react'
import type { Book, BookMeta } from '../../../shared/types'
import { getStatus, STATUS_LABEL } from '../../../shared/types'
import { formatDate, formatAuthor } from '../utils'

interface Props {
  book: Book
  onClick: () => void
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
        {(book.startDate || book.endDate) && (
          <p className="book-card-dates">
            {formatDate(book.startDate)}{book.endDate ? ` → ${formatDate(book.endDate)}` : ''}
          </p>
        )}
        {book.score !== undefined && (
          <p className="book-card-score">★ {book.score.toFixed(1)}</p>
        )}
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import type { Book, BookMeta } from '../../../shared/types'
import { getStatus, STATUS_LABEL, CATEGORY_LABEL } from '../../../shared/types'
import { formatDate } from '../utils'

interface Props {
  book: Book
  onClose: () => void
  onToggleAbandoned: () => void
  onEdit: () => void
  onDelete: () => void
}

function PencilIcon(): React.JSX.Element {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon(): React.JSX.Element {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function CloudDownloadIcon(): React.JSX.Element {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="8 17 12 21 16 17" />
      <line x1="12" y1="21" x2="12" y2="11" />
      <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
    </svg>
  )
}

function SpinnerIcon(): React.JSX.Element {
  return (
    <svg className="spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

export default function BookDetail({ book, onClose, onToggleAbandoned, onEdit, onDelete }: Props): React.JSX.Element {
  const [meta, setMeta] = useState<BookMeta | null>(null)
  const [fetchingMeta, setFetchingMeta] = useState(false)

  useEffect(() => {
    window.electron.getBookMeta(book.id).then(setMeta)
  }, [book.id])

  const handleFetchMeta = async (): Promise<void> => {
    setFetchingMeta(true)
    try {
      const m = await window.electron.fetchBookMeta(book.id)
      setMeta(m)
    } finally {
      setFetchingMeta(false)
    }
  }

  const status = getStatus(book)
  const canToggle = status === 'pending' || status === 'abandoned'
  const hasExtraInfo = meta && (meta.pages !== undefined || meta.originalTitle || meta.description)

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal book-detail">
        <div className="detail-header">
          <div className="detail-cover">
            {meta?.cover
              ? <img src={meta.cover} alt={book.title} />
              : <span className="detail-cover-letter">{book.title[0]?.toUpperCase()}</span>
            }
          </div>
          <div className="detail-header-info">
            <h2>{book.title}</h2>
            <span className="detail-author">{book.author} · {book.year}</span>
          </div>
          <div className="detail-header-actions">
            <button className="btn-icon detail-close" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="detail-meta">
          <div className="detail-meta-item">
            <span className="meta-label">Estado</span>
            <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>
          </div>
          <div className="detail-meta-item">
            <span className="meta-label">Inicio</span>
            <span>{formatDate(book.startDate)}</span>
          </div>
          <div className="detail-meta-item">
            <span className="meta-label">Fin</span>
            <span>{formatDate(book.endDate)}</span>
          </div>
        </div>

        <div className="detail-meta detail-meta-2col">
          <div className="detail-meta-item">
            <span className="meta-label">ISBN</span>
            <span className="isbn-value">{book.isbn}</span>
          </div>
          <div className="detail-meta-item">
            <span className="meta-label">Categoría</span>
            <span className="meta-value">{CATEGORY_LABEL[book.category]}</span>
          </div>
        </div>

        {hasExtraInfo && (
          <div className="detail-book-info">
            {(meta.pages !== undefined || meta.originalTitle) && (
              <div className="detail-book-info-row">
                {meta.originalTitle && (
                  <div className="detail-meta-item">
                    <span className="meta-label">Título original</span>
                    <span className="meta-value">{meta.originalTitle}</span>
                  </div>
                )}
                {meta.pages !== undefined && (
                  <div className="detail-meta-item">
                    <span className="meta-label">Páginas</span>
                    <span>{meta.pages}</span>
                  </div>
                )}
              </div>
            )}
            {meta.description && (
              <div className="detail-meta-item">
                <span className="meta-label">Sinopsis</span>
                <p className="detail-description">{meta.description}</p>
              </div>
            )}
          </div>
        )}

        {book.rereads.length > 0 && (
          <div className="detail-rereads">
            <span className="meta-label">Relecturas</span>
            <ul>
              {book.rereads.map((r, i) => (
                <li key={i}>
                  {formatDate(r.startDate)} → {r.endDate ? formatDate(r.endDate) : 'En curso'}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="detail-footer">
          {canToggle && (
            <label className="toggle-wrap">
              <span className="toggle-label">Abandonado</span>
              <span className="toggle">
                <input
                  type="checkbox"
                  checked={!!book.abandoned}
                  onChange={onToggleAbandoned}
                />
                <span className="toggle-slider" />
              </span>
            </label>
          )}
          <div className="detail-footer-actions">
            <button
              className="btn-icon"
              onClick={handleFetchMeta}
              disabled={fetchingMeta}
              title="Buscar información del libro"
            >
              {fetchingMeta ? <SpinnerIcon /> : <CloudDownloadIcon />}
            </button>
            <button className="btn-icon" onClick={onEdit}><PencilIcon /></button>
            <button className="btn-icon btn-icon-danger" onClick={onDelete}><TrashIcon /></button>
          </div>
        </div>
      </div>
    </div>
  )
}

import React from 'react'
import type { Book } from '../types'
import { getStatus, STATUS_LABEL } from '../types'

interface Props {
  book: Book
  onClose: () => void
  onToggleAbandoned: () => void
  onEdit: () => void
  onDelete: () => void
}

function formatDate(date?: string): string {
  if (!date) return '—'
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
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

export default function BookDetail({ book, onClose, onToggleAbandoned, onEdit, onDelete }: Props): React.JSX.Element {
  const status = getStatus(book)
  const canToggle = status === 'pending' || status === 'abandonado'

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal book-detail">
        <div className="detail-header">
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
            <span className="meta-label">Páginas</span>
            <span>{book.pages}</span>
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
            <button className="btn-icon" onClick={onEdit}><PencilIcon /></button>
            <button className="btn-icon btn-icon-danger" onClick={onDelete}><TrashIcon /></button>
          </div>
        </div>
      </div>
    </div>
  )
}

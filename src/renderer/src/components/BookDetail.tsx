import React, { useState, useEffect } from 'react'
import type { Book, BookMeta } from '../../../shared/types'
import { getStatus, STATUS_LABEL, CATEGORY_LABEL } from '../../../shared/types'
import { formatDate } from '../utils'

interface Props {
  book: Book
  onClose: () => void
  onBookUpdate: (books: Book[]) => void
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

type StarFill = 'full' | 'half' | 'empty'

function Star({ pos, fill }: { pos: number; fill: StarFill }): React.JSX.Element {
  const pts = "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
  const clipId = `shc-${pos}`
  if (fill === 'full') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24">
        <polygon points={pts} fill="#f59e0b" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    )
  }
  if (fill === 'empty') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24">
        <polygon points={pts} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <defs>
        <clipPath id={clipId}><rect x="0" y="0" width="12" height="24" /></clipPath>
      </defs>
      <polygon points={pts} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points={pts} fill="#f59e0b" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round" clipPath={`url(#${clipId})`} />
    </svg>
  )
}

function StarRating({ score }: { score: number }): React.JSX.Element {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill: StarFill = score >= i ? 'full' : score >= i - 0.5 ? 'half' : 'empty'
        return <Star key={i} pos={i} fill={fill} />
      })}
      <span className="star-value">{score.toFixed(1)}</span>
    </div>
  )
}

export default function BookDetail({ book, onClose, onBookUpdate, onEdit, onDelete }: Props): React.JSX.Element {
  const [meta, setMeta] = useState<BookMeta | null>(null)
  const [fetchingMeta, setFetchingMeta] = useState(false)
  const [tab, setTab] = useState<'info' | 'estadisticas'>('info')
  const [action, setAction] = useState<'start' | 'finish' | null>(null)
  const [startDateVal, setStartDateVal] = useState('')
  const [endDateVal, setEndDateVal] = useState('')
  const [finishScore, setFinishScore] = useState(3)

  useEffect(() => {
    window.electron.getBookMeta(book.id).then(setMeta)
  }, [book.id])

  useEffect(() => {
    setAction(null)
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

  const openStart = (): void => {
    setStartDateVal(new Date().toISOString().split('T')[0])
    setAction('start')
  }

  const openFinish = (): void => {
    setEndDateVal(new Date().toISOString().split('T')[0])
    setFinishScore(book.score ?? 3)
    setAction('finish')
  }

  const handleStart = async (): Promise<void> => {
    const updated = await window.electron.updateBook({ ...book, startDate: startDateVal })
    onBookUpdate(updated)
    setAction(null)
  }

  const handleFinish = async (): Promise<void> => {
    const updated = await window.electron.updateBook({ ...book, endDate: endDateVal, score: finishScore })
    onBookUpdate(updated)
    setAction(null)
  }

  const handleAbandon = async (): Promise<void> => {
    const updated = await window.electron.updateBook({ ...book, abandoned: true })
    onBookUpdate(updated)
  }

  const handleResume = async (): Promise<void> => {
    const updated = await window.electron.updateBook({ ...book, abandoned: false })
    onBookUpdate(updated)
  }

  const status = getStatus(book)
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

        {action === null && (
          <>
            <div className="detail-tabs">
              <button className={`detail-tab${tab === 'info' ? ' active' : ''}`} onClick={() => setTab('info')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
                </svg>
                Info
              </button>
              <button className={`detail-tab${tab === 'estadisticas' ? ' active' : ''}`} onClick={() => setTab('estadisticas')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                Estadísticas
              </button>
            </div>

            {tab === 'info' && (
              <div className="detail-tab-body">
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
              </div>
            )}

            {tab === 'estadisticas' && (
              <div className="detail-tab-body">
                <div className="detail-meta">
                  <div className="detail-meta-item">
                    <span className="meta-label">Páginas</span>
                    <span>{book.pages ?? '—'}</span>
                  </div>
                  <div className="detail-meta-item">
                    <span className="meta-label">Líneas / página</span>
                    <span>{book.linesPerPage ?? '—'}</span>
                  </div>
                  <div className="detail-meta-item">
                    <span className="meta-label">~Palabras</span>
                    <span>{book.pages && book.linesPerPage ? (book.pages * book.linesPerPage * 9).toLocaleString() : '—'}</span>
                  </div>
                </div>
                {book.score !== undefined && (
                  <div className="detail-score">
                    <div className="detail-meta-item">
                      <span className="meta-label">Puntuación</span>
                      <StarRating score={book.score} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {action === 'start' && (
          <div className="detail-tab-body action-form">
            <p className="action-form-title">Iniciar lectura</p>
            <div className="form-field">
              <label>Fecha de inicio *</label>
              <input type="date" value={startDateVal} onChange={(e) => setStartDateVal(e.target.value)} />
            </div>
            <div className="action-form-buttons">
              <button className="btn-ghost" onClick={() => setAction(null)}>Cancelar</button>
              <button className="btn-primary" onClick={handleStart} disabled={!startDateVal}>Iniciar</button>
            </div>
          </div>
        )}

        {action === 'finish' && (
          <div className="detail-tab-body action-form">
            <p className="action-form-title">Finalizar lectura</p>
            <div className="form-field">
              <label>Fecha de finalización *</label>
              <input type="date" value={endDateVal} onChange={(e) => setEndDateVal(e.target.value)} />
            </div>
            <div className="form-field">
              <label>Puntuación</label>
              <div className="score-slider-row">
                <input
                  type="range"
                  className="score-slider"
                  value={finishScore}
                  onChange={(e) => setFinishScore(Number(e.target.value))}
                  min={1} max={5} step={0.1}
                  style={{ background: `linear-gradient(to right, var(--accent) ${(finishScore - 1) / 4 * 100}%, var(--border) ${(finishScore - 1) / 4 * 100}%)` }}
                />
                <span className="score-value-chip">{finishScore.toFixed(1)}</span>
              </div>
            </div>
            <div className="action-form-buttons">
              <button className="btn-ghost" onClick={() => setAction(null)}>Cancelar</button>
              <button className="btn-primary" onClick={handleFinish} disabled={!endDateVal}>Finalizar</button>
            </div>
          </div>
        )}

        <div className="detail-footer">
          <div className="detail-footer-status">
            {status === 'pending' && (
              <button className="btn-primary btn-sm" onClick={openStart}>Iniciar lectura</button>
            )}
            {status === 'in-progress' && (
              <>
                <button className="btn-primary btn-sm" onClick={openFinish}>Finalizar</button>
                <button className="btn-ghost btn-sm btn-danger" onClick={handleAbandon}>Abandonar</button>
              </>
            )}
            {status === 'abandoned' && (
              <button className="btn-ghost btn-sm" onClick={handleResume}>Reanudar</button>
            )}
          </div>
          <div className="detail-footer-actions">
            <button className="btn-icon" onClick={handleFetchMeta} disabled={fetchingMeta} title="Buscar información del libro">
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

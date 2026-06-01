import React, { useState, useEffect } from 'react'
import type { Book, BookMeta } from '../../../shared/types'
import { getStatus, STATUS_LABEL, GENRE_LABEL } from '../../../shared/types'
import { formatDate, WORDS_PER_LINE, LANGUAGE_FLAG } from '../utils'

interface Props {
  book: Book
  allTags: string[]
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

export default function BookDetail({ book, allTags, onClose, onBookUpdate, onEdit, onDelete }: Props): React.JSX.Element {
  const [meta, setMeta] = useState<BookMeta | null>(null)
  const [fetchingMeta, setFetchingMeta] = useState(false)
  const [tab, setTab] = useState<'info' | 'estadisticas' | 'lecturas'>('info')
  const [action, setAction] = useState<'start' | 'finish' | 'reread' | 'resume' | null>(null)
  const [startDateVal, setStartDateVal] = useState('')
  const [endDateVal, setEndDateVal] = useState('')
  const [rereadDateVal, setRereadDateVal] = useState('')
  const [finishScore, setFinishScore] = useState(3)
  const [finishCompleted, setFinishCompleted] = useState(true)
  const [tagInput, setTagInput] = useState('')
  const [tagFocused, setTagFocused] = useState(false)

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
    setStartDateVal(today)
    setAction('start')
  }

  const openFinish = (): void => {
    setEndDateVal(today)
    setFinishScore(book.score ?? 3)
    setFinishCompleted(true)
    setAction('finish')
  }

  const openReread = (): void => {
    setRereadDateVal(today)
    setAction('reread')
  }

  const handleStart = async (): Promise<void> => {
    const updated = await window.electron.updateBook({
      ...book,
      readings: [...book.readings, { startDate: startDateVal }],
    })
    onBookUpdate(updated)
    setAction(null)
  }

  const handleFinish = async (): Promise<void> => {
    const readings = [...book.readings]
    readings[readings.length - 1] = { ...readings[readings.length - 1], endDate: endDateVal, completed: finishCompleted }
    const updated = await window.electron.updateBook({
      ...book,
      readings,
      score: finishCompleted ? finishScore : book.score,
    })
    onBookUpdate(updated)
    setAction(null)
  }

  const handleReread = async (): Promise<void> => {
    const updated = await window.electron.updateBook({
      ...book,
      readings: [...book.readings, { startDate: rereadDateVal }],
    })
    onBookUpdate(updated)
    setAction(null)
    setTab('lecturas')
  }

  const openResume = (): void => {
    setStartDateVal(today)
    setAction('resume')
  }

  const handleResume = async (): Promise<void> => {
    const updated = await window.electron.updateBook({
      ...book,
      readings: [...book.readings, { startDate: startDateVal }],
    })
    onBookUpdate(updated)
    setAction(null)
  }

  const addTag = async (tag: string): Promise<void> => {
    const t = tag.trim()
    if (!t || book.tags?.includes(t)) return
    const updated = await window.electron.updateBook({ ...book, tags: [...(book.tags ?? []), t] })
    onBookUpdate(updated)
    setTagInput('')
  }

  const removeTag = async (tag: string): Promise<void> => {
    const updated = await window.electron.updateBook({ ...book, tags: (book.tags ?? []).filter((t) => t !== tag) })
    onBookUpdate(updated)
  }

  const tagSuggestions = tagInput.trim()
    ? allTags.filter((t) => t.toLowerCase().includes(tagInput.toLowerCase()) && !book.tags?.includes(t)).slice(0, 6)
    : []

  const today = new Date().toISOString().split('T')[0]
  const status = getStatus(book)
  const lastReading = book.readings.length > 0 ? book.readings[book.readings.length - 1] : undefined
  const hasExtraInfo = meta && (!!meta.subjects?.length || !!meta.description)

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
            {book.additionalData.originalTitle && book.additionalData.originalTitle.toLowerCase() !== book.title.toLowerCase() && (
              <span className="detail-original-title">({book.additionalData.originalTitle})</span>
            )}
            <span className="detail-author">{book.author} · {book.year}</span>
            <span className="detail-isbn">ISBN: {book.isbn}</span>
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
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                Métricas
              </button>
              <button className={`detail-tab${tab === 'lecturas' ? ' active' : ''}`} onClick={() => setTab('lecturas')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.5" />
                </svg>
                Lecturas
                {book.readings.length > 1 && <span className="detail-tab-count">{book.readings.length}</span>}
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
                    <span>{formatDate(lastReading?.startDate)}</span>
                  </div>
                  <div className="detail-meta-item">
                    <span className="meta-label">Fin</span>
                    <span>{formatDate(lastReading?.endDate)}</span>
                  </div>
                </div>

                <div className="detail-meta detail-meta-2col">
                  <div className="detail-meta-item">
                    <span className="meta-label">Género</span>
                    <span className="meta-value">{book.additionalData.genre ? GENRE_LABEL[book.additionalData.genre] : '—'}</span>
                  </div>
                  {book.additionalData.originalLanguage && (
                    <div className="detail-meta-item">
                      <span className="meta-label">Idioma original</span>
                      <span className="meta-value">
                        {LANGUAGE_FLAG[book.additionalData.originalLanguage] && (
                          <span style={{ marginRight: 5 }}>{LANGUAGE_FLAG[book.additionalData.originalLanguage]}</span>
                        )}
                        {book.additionalData.originalLanguage}
                      </span>
                    </div>
                  )}
                </div>

                {hasExtraInfo && (
                  <div className="detail-book-info">
                    {meta.subjects && meta.subjects.length > 0 && (
                      <div className="detail-meta-item">
                        <span className="meta-label">Temas</span>
                        <div className="detail-subjects">
                          {meta.subjects.map((s) => (
                            <span key={s} className="detail-subject-tag">{s}</span>
                          ))}
                        </div>
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
              </div>
            )}

            {tab === 'estadisticas' && (
              <div className="detail-tab-body">
                <div className="detail-meta">
                  <div className="detail-meta-item">
                    <span className="meta-label">Páginas</span>
                    <span>{book.additionalData.pages ?? '—'}</span>
                  </div>
                  <div className="detail-meta-item">
                    <span className="meta-label">Líneas / página</span>
                    <span>{book.additionalData.linesPerPage ?? '—'}</span>
                  </div>
                  <div className="detail-meta-item">
                    <span className="meta-label">~Palabras</span>
                    <span>{book.additionalData.pages && book.additionalData.linesPerPage ? (book.additionalData.pages * book.additionalData.linesPerPage * WORDS_PER_LINE).toLocaleString() : '—'}</span>
                  </div>
                </div>
                {status === 'finished' && (
                  <>
                    <div className="detail-tags-section">
                      <span className="meta-label">Tags</span>
                      {book.tags && book.tags.length > 0 && (
                        <div className="detail-tags-list">
                          {book.tags.map((tag) => (
                            <span key={tag} className="detail-tag">
                              {tag}
                              <button className="detail-tag-remove" onClick={() => removeTag(tag)}>×</button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="detail-tag-input-wrap">
                        <input
                          className="detail-tag-input"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onFocus={() => setTagFocused(true)}
                          onBlur={() => setTimeout(() => setTagFocused(false), 150)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput) } }}
                          placeholder="Añadir tag..."
                          autoComplete="off"
                          spellCheck={false}
                        />
                        {tagFocused && tagSuggestions.length > 0 && (
                          <div className="detail-tag-suggestions">
                            {tagSuggestions.map((s) => (
                              <button key={s} className="detail-tag-suggestion" onMouseDown={() => addTag(s)}>{s}</button>
                            ))}
                          </div>
                        )}
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
                  </>
                )}
              </div>
            )}

            {tab === 'lecturas' && (
              <div className="detail-tab-body">
                {book.readings.length === 0 ? (
                  <p className="readings-empty">Sin lecturas registradas.</p>
                ) : (
                  <ul className="readings-list">
                    {book.readings.map((r, i) => {
                      const endTs = r.endDate ? new Date(r.endDate).getTime() : new Date(today).getTime()
                      const days = Math.round((endTs - new Date(r.startDate).getTime()) / 86400000)
                      return (
                        <li key={i} className="reading-item">
                          <span className="reading-index">{i + 1}</span>
                          <span className="reading-dates">
                            {formatDate(r.startDate)}{r.endDate ? ` → ${formatDate(r.endDate)}` : ' → En curso'}
                          </span>
                          <span className="reading-days">{days} días</span>
                          {r.endDate && (
                            <span className={`badge badge-${r.completed ? 'finished' : 'abandoned'}`}>
                              {r.completed ? 'Terminado' : 'Abandonado'}
                            </span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
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
              <input type="date" value={startDateVal} max={today} onChange={(e) => setStartDateVal(e.target.value)} />
            </div>
            <div className="action-form-buttons">
              <button className="btn-ghost" onClick={() => setAction(null)}>Cancelar</button>
              <button className="btn-primary" onClick={handleStart} disabled={!startDateVal || startDateVal > today}>Iniciar</button>
            </div>
          </div>
        )}

        {action === 'finish' && (
          <div className="detail-tab-body action-form">
            <p className="action-form-title">Terminar lectura</p>
            <div className="form-field">
              <label>Fecha de finalización *</label>
              <input type="date" value={endDateVal} min={lastReading?.startDate} max={today} onChange={(e) => setEndDateVal(e.target.value)} />
            </div>
            <div className="form-field">
              <label>¿Terminaste el libro?</label>
              <div className="action-segment">
                <button
                  type="button"
                  className={`action-segment-btn${finishCompleted ? ' active' : ''}`}
                  onClick={() => setFinishCompleted(true)}
                >
                  Sí, lo terminé
                </button>
                <button
                  type="button"
                  className={`action-segment-btn${!finishCompleted ? ' active-abandoned' : ''}`}
                  onClick={() => setFinishCompleted(false)}
                >
                  No, lo abandoné
                </button>
              </div>
            </div>
            {finishCompleted && (
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
            )}
            <div className="action-form-buttons">
              <button className="btn-ghost" onClick={() => setAction(null)}>Cancelar</button>
              <button className="btn-primary" onClick={handleFinish} disabled={!endDateVal || endDateVal > today || (!!lastReading?.startDate && endDateVal < lastReading.startDate)}>
                {finishCompleted ? 'Finalizar' : 'Abandonar'}
              </button>
            </div>
          </div>
        )}

        {action === 'reread' && (
          <div className="detail-tab-body action-form">
            <p className="action-form-title">Registrar relectura</p>
            <div className="form-field">
              <label>Fecha de inicio *</label>
              <input type="date" value={rereadDateVal} min={lastReading?.endDate} max={today} onChange={(e) => setRereadDateVal(e.target.value)} />
            </div>
            <div className="action-form-buttons">
              <button className="btn-ghost" onClick={() => setAction(null)}>Cancelar</button>
              <button className="btn-primary" onClick={handleReread} disabled={!rereadDateVal || rereadDateVal > today || (!!lastReading?.endDate && rereadDateVal < lastReading.endDate)}>Releer</button>
            </div>
          </div>
        )}

        {action === 'resume' && (
          <div className="detail-tab-body action-form">
            <p className="action-form-title">Reanudar lectura</p>
            <div className="form-field">
              <label>Fecha de inicio *</label>
              <input type="date" value={startDateVal} min={lastReading?.endDate} max={today} onChange={(e) => setStartDateVal(e.target.value)} />
            </div>
            <div className="action-form-buttons">
              <button className="btn-ghost" onClick={() => setAction(null)}>Cancelar</button>
              <button className="btn-primary" onClick={handleResume} disabled={!startDateVal || startDateVal > today || (!!lastReading?.endDate && startDateVal < lastReading.endDate)}>Reanudar</button>
            </div>
          </div>
        )}

        <div className="detail-footer">
          <div className="detail-footer-status">
            {status === 'pending' && (
              <button className="btn-primary btn-sm" onClick={openStart}>Iniciar lectura</button>
            )}
            {status === 'in-progress' && (
              <button className="btn-primary btn-sm" onClick={openFinish}>Terminar lectura</button>
            )}
            {status === 'abandoned' && (
              <button className="btn-ghost btn-sm" onClick={openResume}>Reanudar</button>
            )}
            {status === 'finished' && (
              <button className="btn-ghost btn-sm" onClick={openReread}>Releer</button>
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

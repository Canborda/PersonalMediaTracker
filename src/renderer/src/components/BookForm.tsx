import React, { useState, useRef, useEffect } from 'react'
import type { Book, BookCategory } from '../../../shared/types'
import { BOOK_CATEGORIES, CATEGORY_LABEL } from '../../../shared/types'

type Section = 'libro' | 'estadisticas' | 'lectura'
type FormData = Omit<Book, 'id' | 'category' | 'score'> & { category: BookCategory | ''; score: number | undefined }

interface Props {
  onClose: () => void
  onSave: (book: Omit<Book, 'id'>) => void
  initialData?: Book
}

const empty = (initial?: Book): FormData => ({
  title: initial?.title ?? '',
  author: initial?.author ?? '',
  year: initial?.year ?? ('' as unknown as number),
  isbn: initial?.isbn ?? '',
  category: initial?.category ?? '',
  startDate: initial?.startDate,
  endDate: initial?.endDate,
  abandoned: initial?.abandoned ?? false,
  rereads: initial?.rereads ?? [],
  pages: initial?.pages,
  linesPerPage: initial?.linesPerPage,
  score: initial?.score,
})

function validateIsbn(value: string): string {
  if (value.length === 0) return 'El ISBN es obligatorio'
  if (value.length !== 10 && value.length !== 13) return 'Debe tener 10 o 13 dígitos'
  return ''
}

function ChevronDownIcon(): React.JSX.Element {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function CheckIcon(): React.JSX.Element {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function CategoryDropdown({ value, onChange }: { value: BookCategory | ''; onChange: (v: BookCategory) => void }): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const handleToggle = (): void => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setMenuPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
    }
    setOpen((o) => !o)
  }

  return (
    <div ref={ref} className={`form-dropdown${open ? ' open' : ''}`}>
      <button ref={triggerRef} type="button" className="form-dropdown-trigger" onClick={handleToggle}>
        <span className={value ? '' : 'form-dropdown-placeholder'}>
          {value ? CATEGORY_LABEL[value] : 'Seleccionar categoría'}
        </span>
        <ChevronDownIcon />
      </button>
      {open && menuPos && (
        <div className="form-dropdown-menu" style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}>
          {BOOK_CATEGORIES.map((c) => (
            <button key={c} type="button" className={`form-dropdown-item${value === c ? ' active' : ''}`} onClick={() => { onChange(c); setOpen(false) }}>
              {CATEGORY_LABEL[c]}
              {value === c && <CheckIcon />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function BookForm({ onClose, onSave, initialData }: Props): React.JSX.Element {
  const [form, setForm] = useState(() => empty(initialData))
  const [openSection, setOpenSection] = useState<Section | null>('libro')
  const [isbnError, setIsbnError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const set = (field: string, value: unknown): void =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleIsbnChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 13)
    set('isbn', value)
    setIsbnError(validateIsbn(value))
  }

  const section1Complete =
    !!form.title &&
    !!form.author &&
    validateIsbn(form.isbn) === '' &&
    !!form.category &&
    form.year >= 1000

  const section2Complete = !!form.pages && !!form.linesPerPage

  const toggle = (s: Section): void => setOpenSection((prev) => (prev === s ? null : s))

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    setSubmitted(true)
    const isbnErr = validateIsbn(form.isbn)
    if (isbnErr) { setIsbnError(isbnErr); setOpenSection('libro'); return }
    if (!form.title || !form.author || !form.category || !form.year) { setOpenSection('libro'); return }
    if (!form.pages || !form.linesPerPage) { setOpenSection('estadisticas'); return }
    onSave({
      ...form,
      category: form.category as BookCategory,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
    })
  }

  const scoreVal = form.score ?? 3

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal book-form">
        <h2>{initialData ? 'Editar libro' : 'Agregar libro'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-sections">

            <div className={`form-section${openSection === 'libro' ? ' open' : ''}`}>
              <button type="button" className={`form-section-header${section1Complete ? ' complete' : ''}`} onClick={() => toggle('libro')}>
                <span className="form-section-badge">{section1Complete ? <CheckIcon /> : '1'}</span>
                <span className="form-section-title">Información del libro</span>
                <span className="form-section-chevron"><ChevronDownIcon /></span>
              </button>
              {openSection === 'libro' && (
                <div className="form-section-body">
                  <div className="form-grid">
                    <div className="form-field full">
                      <label>Título *</label>
                      <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Título del libro" autoFocus />
                    </div>
                    <div className="form-field full">
                      <label>Autor *</label>
                      <input type="text" value={form.author} onChange={(e) => set('author', e.target.value)} placeholder="Nombre del autor" />
                    </div>
                    <div className="form-field">
                      <label>ISBN *</label>
                      <input type="text" value={form.isbn} onChange={handleIsbnChange} onBlur={() => setIsbnError(validateIsbn(form.isbn))} placeholder="9780000000000" maxLength={13} />
                      {isbnError && <span className="field-error">{isbnError}</span>}
                    </div>
                    <div className="form-field">
                      <label>Categoría *</label>
                      <CategoryDropdown value={form.category} onChange={(v) => set('category', v)} />
                    </div>
                    <div className="form-field">
                      <label>Año de publicación *</label>
                      <input type="number" value={form.year} onChange={(e) => set('year', Number(e.target.value))} placeholder="2024" min={0} max={2100} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={`form-section${openSection === 'estadisticas' ? ' open' : ''}`}>
              <button type="button" className={`form-section-header${section2Complete ? ' complete' : ''}`} onClick={() => toggle('estadisticas')}>
                <span className="form-section-badge">{section2Complete ? <CheckIcon /> : '2'}</span>
                <span className="form-section-title">Estadísticas</span>
                <span className="form-section-chevron"><ChevronDownIcon /></span>
              </button>
              {openSection === 'estadisticas' && (
                <div className="form-section-body">
                  <div className="form-grid">
                    <div className="form-field">
                      <label>Páginas *</label>
                      <input type="number" value={form.pages ?? ''} onChange={(e) => set('pages', e.target.value === '' ? undefined : Number(e.target.value))} min={1} placeholder="300" />
                      {submitted && !form.pages && <span className="field-error">Las páginas son obligatorias</span>}
                    </div>
                    <div className="form-field">
                      <label>Líneas por página *</label>
                      <input type="number" value={form.linesPerPage ?? ''} onChange={(e) => set('linesPerPage', e.target.value === '' ? undefined : Number(e.target.value))} min={1} placeholder="30" />
                      {submitted && !form.linesPerPage && <span className="field-error">Las líneas por página son obligatorias</span>}
                    </div>
                    {initialData?.endDate && (
                      <div className="form-field full">
                        <label>Puntuación</label>
                        <div className="score-slider-row">
                          <input
                            type="range" className="score-slider" value={scoreVal}
                            onChange={(e) => set('score', Number(e.target.value))}
                            min={1} max={5} step={0.1}
                            style={{ background: `linear-gradient(to right, var(--accent) ${(scoreVal - 1) / 4 * 100}%, var(--border) ${(scoreVal - 1) / 4 * 100}%)` }}
                          />
                          <span className="score-value-chip">{scoreVal.toFixed(1)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {initialData?.endDate && (
              <div className={`form-section${openSection === 'lectura' ? ' open' : ''}`}>
                <button type="button" className="form-section-header" onClick={() => toggle('lectura')}>
                  <span className="form-section-badge">3</span>
                  <span className="form-section-title">Lectura</span>
                  <span className="form-section-chevron"><ChevronDownIcon /></span>
                </button>
                {openSection === 'lectura' && (
                  <div className="form-section-body">
                    <div className="form-grid">
                      <div className="form-field">
                        <label>Fecha de inicio</label>
                        <div className="date-input-row">
                          <input type="date" value={form.startDate ?? ''} onChange={(e) => set('startDate', e.target.value || undefined)} />
                          {form.startDate && (
                            <button type="button" className="btn-icon btn-icon-sm" onClick={() => set('startDate', undefined)} title="Borrar fecha">×</button>
                          )}
                        </div>
                      </div>
                      <div className="form-field">
                        <label>Fecha de finalización</label>
                        <div className="date-input-row">
                          <input type="date" value={form.endDate ?? ''} onChange={(e) => set('endDate', e.target.value || undefined)} />
                          {form.endDate && (
                            <button type="button" className="btn-icon btn-icon-sm" onClick={() => set('endDate', undefined)} title="Borrar fecha">×</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          <div className="form-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

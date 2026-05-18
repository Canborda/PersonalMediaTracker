import React, { useState, useRef, useEffect } from 'react'
import type { Book, BookCategory, BookAdditionalData } from '../../../shared/types'
import { BOOK_CATEGORIES, CATEGORY_LABEL, getStatus } from '../../../shared/types'
import { LANGUAGES } from '../utils'

type Section = 'basica' | 'adicional' | 'puntuacion'

type FormAdditionalData = {
  originalTitle: string
  originalLanguage: string
  category: BookCategory | ''
  pages: number | undefined
  linesPerPage: number | undefined
}

type FormData = {
  title: string
  author: string
  year: number
  isbn: string
  readings: Book['readings']
  score: number | undefined
  additionalData: FormAdditionalData
}

interface Props {
  onClose: () => void
  onSave: (book: Omit<Book, 'id'>) => void
  initialData?: Book
}

const CURRENT_YEAR = new Date().getFullYear()

const empty = (initial?: Book): FormData => ({
  title: initial?.title ?? '',
  author: initial?.author ?? '',
  year: initial?.year ?? ('' as unknown as number),
  isbn: initial?.isbn ?? '',
  readings: initial?.readings ?? [],
  score: initial?.score,
  additionalData: {
    originalTitle: initial?.additionalData.originalTitle ?? '',
    originalLanguage: initial?.additionalData.originalLanguage ?? '',
    category: initial?.additionalData.category ?? '',
    pages: initial?.additionalData.pages,
    linesPerPage: initial?.additionalData.linesPerPage,
  },
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

function LanguageDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }): React.JSX.Element {
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

  const selected = LANGUAGES.find((l) => l.label === value)

  return (
    <div ref={ref} className={`form-dropdown${open ? ' open' : ''}`}>
      <button ref={triggerRef} type="button" className="form-dropdown-trigger" onClick={handleToggle}>
        <span className={value ? '' : 'form-dropdown-placeholder'}>
          {selected ? `${selected.flag} ${selected.label}` : 'Seleccionar idioma'}
        </span>
        <ChevronDownIcon />
      </button>
      {open && menuPos && (
        <div className="form-dropdown-menu" style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}>
          {LANGUAGES.map((l) => (
            <button key={l.label} type="button" className={`form-dropdown-item${value === l.label ? ' active' : ''}`} onClick={() => { onChange(l.label); setOpen(false) }}>
              <span className="form-dropdown-flag">{l.flag}</span>
              {l.label}
              {value === l.label && <CheckIcon />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function BookForm({ onClose, onSave, initialData }: Props): React.JSX.Element {
  const [form, setForm] = useState(() => empty(initialData))
  const [openSection, setOpenSection] = useState<Section | null>('basica')
  const [isbnError, setIsbnError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const set = (field: string, value: unknown): void =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const setAdditional = (field: string, value: unknown): void =>
    setForm((prev) => ({ ...prev, additionalData: { ...prev.additionalData, [field]: value } }))

  const handleIsbnChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 13)
    set('isbn', value)
    setIsbnError(validateIsbn(value))
  }

  const section1Complete =
    !!form.title &&
    !!form.author &&
    validateIsbn(form.isbn) === '' &&
    form.year >= 1000 &&
    form.year <= CURRENT_YEAR

  const toggle = (s: Section): void => setOpenSection((prev) => (prev === s ? null : s))

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    setSubmitted(true)
    const isbnErr = validateIsbn(form.isbn)
    if (isbnErr) { setIsbnError(isbnErr); setOpenSection('basica'); return }
    if (!form.title || !form.author || form.year < 1000 || form.year > CURRENT_YEAR) { setOpenSection('basica'); return }

    const additionalData: BookAdditionalData = {}
    if (form.additionalData.originalTitle) additionalData.originalTitle = form.additionalData.originalTitle
    if (form.additionalData.originalLanguage) additionalData.originalLanguage = form.additionalData.originalLanguage
    if (form.additionalData.category) additionalData.category = form.additionalData.category as BookCategory
    if (form.additionalData.pages !== undefined) additionalData.pages = form.additionalData.pages
    if (form.additionalData.linesPerPage !== undefined) additionalData.linesPerPage = form.additionalData.linesPerPage

    onSave({
      title: form.title,
      author: form.author,
      year: form.year,
      isbn: form.isbn,
      readings: form.readings,
      score: form.score,
      additionalData,
    })
  }

  const isFinished = !!initialData && getStatus(initialData) === 'finished'
  const scoreVal = form.score ?? 3

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal book-form">
        <h2>{initialData ? 'Editar libro' : 'Agregar libro'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-sections">

            <div className={`form-section${openSection === 'basica' ? ' open' : ''}`}>
              <button type="button" className={`form-section-header${section1Complete ? ' complete' : ''}`} onClick={() => toggle('basica')}>
                <span className="form-section-badge">{section1Complete ? <CheckIcon /> : '1'}</span>
                <span className="form-section-title">Información básica</span>
                <span className="form-section-chevron"><ChevronDownIcon /></span>
              </button>
              {openSection === 'basica' && (
                <div className="form-section-body">
                  <div className="form-grid">
                    <div className="form-field full">
                      <label>Título *</label>
                      <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Título del libro" autoFocus />
                      {submitted && !form.title && <span className="field-error">Campo obligatorio</span>}
                    </div>
                    <div className="form-field full">
                      <label>Autor *</label>
                      <input type="text" value={form.author} onChange={(e) => set('author', e.target.value)} placeholder="Nombre del autor" />
                      {submitted && !form.author && <span className="field-error">Campo obligatorio</span>}
                    </div>
                    <div className="form-field">
                      <label>ISBN *</label>
                      <input type="text" value={form.isbn} onChange={handleIsbnChange} onBlur={() => setIsbnError(validateIsbn(form.isbn))} placeholder="9780000000000" maxLength={13} />
                      {isbnError && <span className="field-error">{isbnError}</span>}
                    </div>
                    <div className="form-field">
                      <label>Año de publicación *</label>
                      <input type="number" value={form.year} onChange={(e) => set('year', Number(e.target.value))} placeholder="2024" />
                      {submitted && form.year < 1000 && <span className="field-error">Ingresa el año completo</span>}
                      {submitted && form.year >= 1000 && form.year > CURRENT_YEAR && <span className="field-error">No puede ser mayor al año actual</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={`form-section${openSection === 'adicional' ? ' open' : ''}`}>
              <button type="button" className="form-section-header" onClick={() => toggle('adicional')}>
                <span className="form-section-badge">2</span>
                <span className="form-section-title">Información adicional</span>
                <span className="form-section-chevron"><ChevronDownIcon /></span>
              </button>
              {openSection === 'adicional' && (
                <div className="form-section-body">
                  <div className="form-grid">
                    <div className="form-field full">
                      <label>Título original</label>
                      <input type="text" value={form.additionalData.originalTitle} onChange={(e) => setAdditional('originalTitle', e.target.value)} placeholder="Original title" />
                    </div>
                    <div className="form-field">
                      <label>Idioma original</label>
                      <LanguageDropdown value={form.additionalData.originalLanguage} onChange={(v) => setAdditional('originalLanguage', v)} />
                    </div>
                    <div className="form-field">
                      <label>Categoría</label>
                      <CategoryDropdown value={form.additionalData.category} onChange={(v) => setAdditional('category', v)} />
                    </div>
                  </div>

                  <div className="form-subsection-label">Métricas</div>

                  <div className="form-grid">
                    <div className="form-field">
                      <label>Páginas</label>
                      <input type="number" value={form.additionalData.pages ?? ''} onChange={(e) => setAdditional('pages', e.target.value === '' ? undefined : Number(e.target.value))} placeholder="300" />
                    </div>
                    <div className="form-field">
                      <label>Líneas por página</label>
                      <input type="number" value={form.additionalData.linesPerPage ?? ''} onChange={(e) => setAdditional('linesPerPage', e.target.value === '' ? undefined : Number(e.target.value))} placeholder="30" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {isFinished && (
              <div className={`form-section${openSection === 'puntuacion' ? ' open' : ''}`}>
                <button type="button" className="form-section-header" onClick={() => toggle('puntuacion')}>
                  <span className="form-section-badge">3</span>
                  <span className="form-section-title">Puntuación</span>
                  <span className="form-section-chevron"><ChevronDownIcon /></span>
                </button>
                {openSection === 'puntuacion' && (
                  <div className="form-section-body">
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

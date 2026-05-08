import React, { useState } from 'react'
import type { Book, BookCategory, ReadSession } from '../../../shared/types'
import { BOOK_CATEGORIES, CATEGORY_LABEL } from '../../../shared/types'

type Tab = 'libro' | 'lectura'
type FormData = Omit<Book, 'id' | 'category'> & { category: BookCategory | '' }

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
  rereads: initial?.rereads ?? []
})

function validateIsbn(value: string): string {
  if (value.length === 0) return 'El ISBN es obligatorio'
  if (value.length !== 10 && value.length !== 13) return 'Debe tener 10 o 13 dígitos'
  return ''
}

function BookIcon(): React.JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function CalendarIcon(): React.JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

export default function BookForm({ onClose, onSave, initialData }: Props): React.JSX.Element {
  const [form, setForm] = useState(() => empty(initialData))
  const [tab, setTab] = useState<Tab>('libro')
  const [isbnError, setIsbnError] = useState('')

  const set = (field: string, value: unknown): void =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const addReread = (): void =>
    setForm((prev) => ({ ...prev, rereads: [...prev.rereads, { startDate: '' }] }))

  const updateReread = (i: number, field: keyof ReadSession, value: string): void =>
    setForm((prev) => {
      const rereads = [...prev.rereads]
      rereads[i] = { ...rereads[i], [field]: value || undefined }
      return { ...prev, rereads }
    })

  const removeReread = (i: number): void =>
    setForm((prev) => ({ ...prev, rereads: prev.rereads.filter((_, idx) => idx !== i) }))

  const handleIsbnChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 13)
    set('isbn', value)
    setIsbnError(validateIsbn(value))
  }

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    const isbnErr = validateIsbn(form.isbn)
    if (isbnErr) { setIsbnError(isbnErr); setTab('libro'); return }
    if (!form.title || !form.author || !form.category || !form.year) { setTab('libro'); return }
    onSave({
      ...form,
      category: form.category as BookCategory,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined
    })
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{initialData ? 'Editar libro' : 'Agregar libro'}</h2>

        <div className="form-tabs">
          <button
            type="button"
            className={`form-tab ${tab === 'libro' ? 'active' : ''}`}
            onClick={() => setTab('libro')}
          >
            <BookIcon />
            Libro
          </button>
          <button
            type="button"
            className={`form-tab ${tab === 'lectura' ? 'active' : ''}`}
            onClick={() => setTab('lectura')}
          >
            <CalendarIcon />
            Lectura
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {tab === 'libro' && (
            <div className="form-grid">
              <div className="form-field full">
                <label>Título *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Título del libro"
                  required
                />
              </div>

              <div className="form-field full">
                <label>Autor *</label>
                <input
                  type="text"
                  value={form.author}
                  onChange={(e) => set('author', e.target.value)}
                  placeholder="Nombre del autor"
                  required
                />
              </div>

              <div className="form-field">
                <label>ISBN *</label>
                <input
                  type="text"
                  value={form.isbn}
                  onChange={handleIsbnChange}
                  onBlur={() => setIsbnError(validateIsbn(form.isbn))}
                  placeholder="9780000000000"
                  maxLength={13}
                />
                {isbnError && <span className="field-error">{isbnError}</span>}
              </div>

              <div className="form-field">
                <label>Categoría *</label>
                <select
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  required
                >
                  <option value="" disabled>Seleccionar categoría</option>
                  {BOOK_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Año de publicación *</label>
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) => set('year', Number(e.target.value))}
                  placeholder="2024"
                  min={0}
                  max={2100}
                  required
                />
              </div>
            </div>
          )}

          {tab === 'lectura' && (
            <div className="form-grid">
              <div className="form-field">
                <label>Fecha de inicio</label>
                <input
                  type="date"
                  value={form.startDate ?? ''}
                  onChange={(e) => set('startDate', e.target.value || undefined)}
                />
              </div>

              <div className="form-field">
                <label>Fecha de finalización</label>
                <input
                  type="date"
                  value={form.endDate ?? ''}
                  onChange={(e) => set('endDate', e.target.value || undefined)}
                />
              </div>

              <div className="rereads">
                <div className="rereads-header">
                  <span>Relecturas</span>
                  <button type="button" className="btn-link" onClick={addReread}>
                    + Agregar relectura
                  </button>
                </div>
                {form.rereads.map((r, i) => (
                  <div className="reread-row" key={i}>
                    <input
                      type="date"
                      value={r.startDate ?? ''}
                      onChange={(e) => updateReread(i, 'startDate', e.target.value)}
                    />
                    <input
                      type="date"
                      value={r.endDate ?? ''}
                      onChange={(e) => updateReread(i, 'endDate', e.target.value)}
                    />
                    <button type="button" className="btn-remove" onClick={() => removeReread(i)}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

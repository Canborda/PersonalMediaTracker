import React, { useState, useEffect, useMemo } from 'react'
import type { Book, BookStatus } from './types'
import { getStatus, STATUS_LABEL } from './types'
import BookForm from './components/BookForm'
import BookDetail from './components/BookDetail'
import SettingsWindow from './components/SettingsWindow'

function formatDate(date?: string): string {
  if (!date) return '—'
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

function StatusBadge({ status }: { status: BookStatus }): React.JSX.Element {
  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>
}

function GearIcon(): React.JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.92c.04-.32.07-.64.07-.98s-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1s.03.65.07.98l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.58 1.69-.98l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66z" />
    </svg>
  )
}

const STATUS_FILTERS: { value: BookStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'finished', label: STATUS_LABEL.finished },
  { value: 'in-progress', label: STATUS_LABEL['in-progress'] },
  { value: 'pending', label: STATUS_LABEL.pending },
  { value: 'abandonado', label: STATUS_LABEL.abandonado }
]

const isSettings = window.location.hash === '#settings'

export default function App(): React.JSX.Element {
  const [books, setBooks] = useState<Book[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<BookStatus | 'all'>('all')
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (!isSettings) window.electron.getBooks().then(setBooks)
  }, [])

  const selectedBook = selectedBookId ? (books.find((b) => b.id === selectedBookId) ?? null) : null

  const filtered = useMemo(() => {
    let result = books
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'all') {
      result = result.filter((b) => getStatus(b) === statusFilter)
    }
    return result
  }, [books, search, statusFilter])

  const handleSave = async (bookData: Omit<Book, 'id'>): Promise<void> => {
    let updated: Book[]
    if (editingBook) {
      updated = await window.electron.updateBook({ ...bookData, id: editingBook.id })
    } else {
      updated = await window.electron.addBook(bookData)
    }
    setBooks(updated)
    setShowForm(false)
    setEditingBook(null)
  }

  const handleToggleAbandoned = async (book: Book): Promise<void> => {
    const updated = await window.electron.updateBook({ ...book, abandoned: !book.abandoned })
    setBooks(updated)
  }

  const handleDelete = async (book: Book): Promise<void> => {
    const updated = await window.electron.deleteBook(book.id)
    setBooks(updated)
    setSelectedBookId(null)
  }

  const openEdit = (book: Book): void => {
    setSelectedBookId(null)
    setEditingBook(book)
    setShowForm(true)
  }

  if (isSettings) return <SettingsWindow />

  return (
    <div className="app">
      <header>
        <div className="header-top">
          <h1>Mis libros</h1>
          <button className="btn-icon" onClick={() => window.electron.openSettings()}>
            <GearIcon />
          </button>
        </div>
        <div className="toolbar">
          <input
            type="search"
            placeholder="Buscar por título o autor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="filter-group">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                className={`btn-filter ${statusFilter === f.value ? 'active' : ''}`}
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + Agregar libro
          </button>
        </div>
      </header>

      <main>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>
              {search || statusFilter !== 'all'
                ? 'No se encontraron resultados.'
                : 'No hay libros. Agrega el primero.'}
            </p>
          </div>
        ) : (
          <table>
            <colgroup>
              <col style={{ width: '130px' }} />
              <col />
              <col style={{ width: '160px' }} />
              <col style={{ width: '70px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '90px' }} />
            </colgroup>
            <thead>
              <tr>
                <th>Estado</th>
                <th>Título</th>
                <th>Autor</th>
                <th>Año</th>
                <th>Páginas</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Relecturas</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((book) => (
                <tr key={book.id} onClick={() => setSelectedBookId(book.id)}>
                  <td><StatusBadge status={getStatus(book)} /></td>
                  <td>{book.title}</td>
                  <td className="td-muted">{book.author}</td>
                  <td className="td-muted">{book.year}</td>
                  <td className="td-muted">{book.pages}</td>
                  <td className="td-muted">{formatDate(book.startDate)}</td>
                  <td className="td-muted">{formatDate(book.endDate)}</td>
                  <td className="td-muted">{book.rereads.length > 0 ? book.rereads.length : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      {selectedBook && (
        <BookDetail
          book={selectedBook}
          onClose={() => setSelectedBookId(null)}
          onToggleAbandoned={() => handleToggleAbandoned(selectedBook)}
          onEdit={() => openEdit(selectedBook)}
          onDelete={() => handleDelete(selectedBook)}
        />
      )}

      {showForm && (
        <BookForm
          onClose={() => { setShowForm(false); setEditingBook(null) }}
          onSave={handleSave}
          initialData={editingBook ?? undefined}
        />
      )}
    </div>
  )
}

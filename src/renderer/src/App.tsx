import React, { useState, useEffect, useMemo } from 'react'
import type { Book, BookStatus } from '../../shared/types'
import { getStatus, STATUS_LABEL, CATEGORY_LABEL } from '../../shared/types'
import BookForm from './components/BookForm'
import BookDetail from './components/BookDetail'
import BookCard from './components/BookCard'
import InfoModal from './components/InfoModal'
import { formatDate, formatAuthor } from './utils'

type SortKey = 'status' | 'title' | 'author' | 'category' | 'year' | 'startDate' | 'endDate'
type SortDir = 'asc' | 'desc'
type ViewMode = 'table' | 'grid'

const STATUS_ORDER: Record<BookStatus, number> = {
  'in-progress': 0,
  'pending': 1,
  'finished': 2,
  'abandoned': 3
}

function sortBooks(books: Book[], key: SortKey, dir: SortDir): Book[] {
  return [...books].sort((a, b) => {
    let cmp = 0
    switch (key) {
      case 'status':
        cmp = STATUS_ORDER[getStatus(a)] - STATUS_ORDER[getStatus(b)]
        break
      case 'title':
        cmp = a.title.localeCompare(b.title)
        break
      case 'author':
        cmp = authorSortKey(a.author).localeCompare(authorSortKey(b.author))
        break
      case 'category':
        cmp = a.category.localeCompare(b.category)
        break
      case 'year':
        cmp = a.year - b.year
        break
      case 'startDate': {
        if (!a.startDate && !b.startDate) { cmp = 0; break }
        if (!a.startDate) return 1
        if (!b.startDate) return -1
        cmp = a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0
        break
      }
      case 'endDate': {
        if (!a.endDate && !b.endDate) { cmp = 0; break }
        if (!a.endDate) return 1
        if (!b.endDate) return -1
        cmp = a.endDate < b.endDate ? -1 : a.endDate > b.endDate ? 1 : 0
        break
      }
    }
    return dir === 'asc' ? cmp : -cmp
  })
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }): React.JSX.Element {
  return <span className="sort-icon">{active ? (dir === 'asc' ? '↑' : '↓') : '↕'}</span>
}

function authorSortKey(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts.length > 1 ? parts.slice(1).join(' ') : name
}

function StatusBadge({ status }: { status: BookStatus }): React.JSX.Element {
  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>
}

function InfoIcon(): React.JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}

function ListIcon(): React.JSX.Element {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}

function GridIcon(): React.JSX.Element {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}

const SORT_LABELS: Record<SortKey, string> = {
  startDate: 'Inicio',
  endDate: 'Fin',
  title: 'Título',
  author: 'Autor',
  status: 'Estado',
  category: 'Categoría',
  year: 'Año',
}

const SORT_KEYS: SortKey[] = ['startDate', 'endDate', 'title', 'author', 'status', 'category', 'year']

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

function SortDropdown({ value, dir, onChange, onToggleDir }: {
  value: SortKey
  dir: SortDir
  onChange: (k: SortKey) => void
  onToggleDir: () => void
}): React.JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <div className={`sort-dropdown${open ? ' open' : ''}`}>
      <div className="sort-control">
        <button className="sort-field-btn" onClick={() => setOpen((o) => !o)}>
          {SORT_LABELS[value]}
          <ChevronDownIcon />
        </button>
        <button
          className="sort-dir-btn"
          onClick={onToggleDir}
          title={dir === 'asc' ? 'Ascendente' : 'Descendente'}
        >
          {dir === 'asc' ? '↑' : '↓'}
        </button>
      </div>
      {open && (
        <>
          <div className="sort-dropdown-backdrop" onClick={() => setOpen(false)} />
          <div className="sort-dropdown-menu">
            {SORT_KEYS.map((k) => (
              <button
                key={k}
                className={`sort-dropdown-item${value === k ? ' active' : ''}`}
                onClick={() => { onChange(k); setOpen(false) }}
              >
                {SORT_LABELS[k]}
                {value === k && <CheckIcon />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const STATUS_FILTERS: { value: BookStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'finished', label: STATUS_LABEL.finished },
  { value: 'in-progress', label: STATUS_LABEL['in-progress'] },
  { value: 'pending', label: STATUS_LABEL.pending },
  { value: 'abandoned', label: STATUS_LABEL.abandoned }
]

export default function App(): React.JSX.Element {
  const [books, setBooks] = useState<Book[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<BookStatus | 'all'>('all')
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('startDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  const handleSort = (key: SortKey): void => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  useEffect(() => {
    window.electron.getBooks().then(setBooks)
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
    return sortBooks(result, sortKey, sortDir)
  }, [books, search, statusFilter, sortKey, sortDir])

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

  return (
    <div className="app">
      <header>
        <div className="header-top">
          <h1>Mis libros</h1>
          <button className="btn-icon" onClick={() => setShowInfo(true)}>
            <InfoIcon />
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
          <div className="toolbar-end">
            {viewMode === 'grid' && (
              <SortDropdown
                value={sortKey}
                dir={sortDir}
                onChange={setSortKey}
                onToggleDir={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              />
            )}
            <div className="view-toggle">
              <button
                className={`btn-icon ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Vista de tabla"
              >
                <ListIcon />
              </button>
              <button
                className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Vista de cuadrícula"
              >
                <GridIcon />
              </button>
            </div>
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              + Agregar libro
            </button>
          </div>
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
        ) : viewMode === 'grid' ? (
          <div className="book-grid">
            {filtered.map((book) => (
              <BookCard key={book.id} book={book} onClick={() => setSelectedBookId(book.id)} />
            ))}
          </div>
        ) : (
          <table>
            <colgroup>
              <col style={{ width: '120px' }} />
              <col />
              <col style={{ width: '150px' }} />
              <col style={{ width: '140px' }} />
              <col style={{ width: '65px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '100px' }} />
            </colgroup>
            <thead>
              <tr>
                <th className={sortKey === 'status' ? 'th-active' : ''} onClick={() => handleSort('status')}>
                  Estado <SortIcon active={sortKey === 'status'} dir={sortDir} />
                </th>
                <th className={sortKey === 'title' ? 'th-active' : ''} onClick={() => handleSort('title')}>
                  Título <SortIcon active={sortKey === 'title'} dir={sortDir} />
                </th>
                <th className={sortKey === 'author' ? 'th-active' : ''} onClick={() => handleSort('author')}>
                  Autor <SortIcon active={sortKey === 'author'} dir={sortDir} />
                </th>
                <th className={sortKey === 'category' ? 'th-active' : ''} onClick={() => handleSort('category')}>
                  Categoría <SortIcon active={sortKey === 'category'} dir={sortDir} />
                </th>
                <th className={sortKey === 'year' ? 'th-active' : ''} onClick={() => handleSort('year')}>
                  Año <SortIcon active={sortKey === 'year'} dir={sortDir} />
                </th>
                <th className={sortKey === 'startDate' ? 'th-active' : ''} onClick={() => handleSort('startDate')}>
                  Inicio <SortIcon active={sortKey === 'startDate'} dir={sortDir} />
                </th>
                <th className={sortKey === 'endDate' ? 'th-active' : ''} onClick={() => handleSort('endDate')}>
                  Fin <SortIcon active={sortKey === 'endDate'} dir={sortDir} />
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((book) => (
                <tr key={book.id} onClick={() => setSelectedBookId(book.id)}>
                  <td><StatusBadge status={getStatus(book)} /></td>
                  <td>{book.title}</td>
                  <td className="td-muted">{formatAuthor(book.author)}</td>
                  <td className="td-muted td-truncate">{CATEGORY_LABEL[book.category]}</td>
                  <td className="td-muted">{book.year}</td>
                  <td className="td-muted">{formatDate(book.startDate)}</td>
                  <td className="td-muted">{formatDate(book.endDate)}</td>
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

      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
    </div>
  )
}

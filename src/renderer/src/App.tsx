import React, { useState, useEffect, useMemo } from 'react'
import type { Book, BookStatus } from '../../shared/types'
import { getStatus, STATUS_LABEL } from '../../shared/types'
import BookForm from './components/BookForm'
import BookDetail from './components/BookDetail'
import BookCard from './components/BookCard'
import SettingsModal from './components/SettingsModal'
import StatsView from './components/StatsView'
import { formatDate, formatAuthor } from './utils'

type SortKey = 'status' | 'title' | 'author' | 'year' | 'startDate' | 'endDate' | 'score'
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
      case 'score': {
        if (a.score === undefined && b.score === undefined) { cmp = 0; break }
        if (a.score === undefined) return 1
        if (b.score === undefined) return -1
        cmp = a.score - b.score
        break
      }
      case 'year':
        cmp = a.year - b.year
        break
      case 'startDate': {
        const aDate = a.readings[0]?.startDate
        const bDate = b.readings[0]?.startDate
        if (!aDate && !bDate) { cmp = 0; break }
        if (!aDate) return 1
        if (!bDate) return -1
        cmp = aDate < bDate ? -1 : aDate > bDate ? 1 : 0
        break
      }
      case 'endDate': {
        const aDate = a.readings[0]?.endDate
        const bDate = b.readings[0]?.endDate
        if (!aDate && !bDate) { cmp = 0; break }
        if (!aDate) return 1
        if (!bDate) return -1
        cmp = aDate < bDate ? -1 : aDate > bDate ? 1 : 0
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

function SettingsIcon(): React.JSX.Element {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
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
  year: 'Año',
  score: 'Puntuación',
}

const SORT_KEYS: SortKey[] = ['startDate', 'endDate', 'title', 'author', 'status', 'year', 'score']

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

function TagFilterDropdown({ allTags, selected, onChange }: {
  allTags: string[]
  selected: Set<string>
  onChange: (tags: Set<string>) => void
}): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const toggle = (tag: string): void => {
    const next = new Set(selected)
    if (next.has(tag)) next.delete(tag)
    else next.add(tag)
    onChange(next)
  }
  const count = selected.size
  return (
    <div className={`tag-filter-dropdown${open ? ' open' : ''}`}>
      <button
        className={`btn-filter tag-filter-btn${count > 0 ? ' active' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        Tags{count > 0 ? ` (${count})` : ''}
        <ChevronDownIcon />
      </button>
      {open && (
        <>
          <div className="sort-dropdown-backdrop" onClick={() => setOpen(false)} />
          <div className="tag-filter-menu">
            {allTags.length === 0 ? (
              <span className="tag-filter-empty">Sin tags registrados</span>
            ) : (
              allTags.map((tag) => (
                <button
                  key={tag}
                  className={`tag-filter-item${selected.has(tag) ? ' active' : ''}`}
                  onClick={() => toggle(tag)}
                >
                  <span className="tag-filter-check">{selected.has(tag) ? '✓' : ''}</span>
                  {tag}
                </button>
              ))
            )}
            {count > 0 && (
              <button className="tag-filter-clear" onClick={() => { onChange(new Set()); setOpen(false) }}>
                Limpiar filtro
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

const STATUS_FILTERS: { value: BookStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'in-progress', label: STATUS_LABEL['in-progress'] },
  { value: 'finished', label: STATUS_LABEL.finished },
  { value: 'abandoned', label: STATUS_LABEL.abandoned },
  { value: 'pending', label: STATUS_LABEL.pending },
]

export default function App(): React.JSX.Element {
  const [books, setBooks] = useState<Book[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<BookStatus | 'all'>('all')
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('startDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [showStats, setShowStats] = useState(true)
  const [tagFilter, setTagFilter] = useState<Set<string>>(new Set())

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
  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const b of books) b.tags?.forEach((t) => set.add(t))
    return Array.from(set).sort()
  }, [books])

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
    if (tagFilter.size > 0) {
      result = result.filter((b) => b.tags?.some((t) => tagFilter.has(t)))
    }
    return sortBooks(result, sortKey, sortDir)
  }, [books, search, statusFilter, tagFilter, sortKey, sortDir])

  const handleSave = async (bookData: Omit<Book, 'id'>): Promise<void> => {
    let updated: Book[]
    if (editingBook) {
      updated = await window.electron.updateBook({ ...bookData, id: editingBook.id, tags: editingBook.tags })
    } else {
      updated = await window.electron.addBook(bookData)
    }
    setBooks(updated)
    setShowForm(false)
    setEditingBook(null)
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
          <div className="header-actions">
            <button
              role="switch"
              aria-checked={showStats}
              className={`btn-stats-toggle${showStats ? ' active' : ''}`}
              onClick={() => setShowStats((s) => !s)}
            >
              <span className="stats-toggle-track">
                <span className="stats-toggle-thumb" />
              </span>
              Estadísticas
            </button>
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              + Agregar libro
            </button>
            <button className="btn-icon" onClick={() => setShowSettings(true)} title="Ajustes">
              <SettingsIcon />
            </button>
          </div>
        </div>
      </header>

      <main>
        <div className="stats-panel" style={{ height: showStats ? '330px' : 0 }}>
          <StatsView books={books} />
        </div>

        <div className="catalog-panel">
          <div className="catalog-toolbar">
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
              <TagFilterDropdown allTags={allTags} selected={tagFilter} onChange={setTagFilter} />
            </div>
            <div className="catalog-toolbar-end">
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
            </div>
          </div>
          <div className="catalog-scroll">
            {filtered.length === 0 ? (
              <div className="empty-state">
                <p>
                  {search || statusFilter !== 'all' || tagFilter.size > 0
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
                  <col style={{ width: '200px' }} />
                  <col style={{ width: '65px' }} />
                  <col style={{ width: '100px' }} />
                  <col style={{ width: '100px' }} />
                  <col style={{ width: '76px' }} />
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
                    <th className={sortKey === 'year' ? 'th-active' : ''} onClick={() => handleSort('year')}>
                      Año <SortIcon active={sortKey === 'year'} dir={sortDir} />
                    </th>
                    <th className={sortKey === 'startDate' ? 'th-active' : ''} onClick={() => handleSort('startDate')}>
                      Inicio <SortIcon active={sortKey === 'startDate'} dir={sortDir} />
                    </th>
                    <th className={sortKey === 'endDate' ? 'th-active' : ''} onClick={() => handleSort('endDate')}>
                      Fin <SortIcon active={sortKey === 'endDate'} dir={sortDir} />
                    </th>
                    <th className={sortKey === 'score' ? 'th-active' : ''} onClick={() => handleSort('score')}>
                      Punt. <SortIcon active={sortKey === 'score'} dir={sortDir} />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((book) => (
                    <tr key={book.id} onClick={() => setSelectedBookId(book.id)}>
                      <td><StatusBadge status={getStatus(book)} /></td>
                      <td>{book.title}</td>
                      <td className="td-muted">{formatAuthor(book.author)}</td>
                      <td className="td-muted">{book.year}</td>
                      <td className="td-muted">{formatDate(book.readings[0]?.startDate)}</td>
                      <td className="td-muted">{formatDate(book.readings[0]?.endDate)}</td>
                      <td className="td-score">{book.score !== undefined ? `★ ${book.score.toFixed(1)}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {selectedBook && (
        <BookDetail
          book={selectedBook}
          allTags={allTags}
          onClose={() => setSelectedBookId(null)}
          onBookUpdate={setBooks}
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

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}

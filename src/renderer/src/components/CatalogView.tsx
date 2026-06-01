import React, { useState, useMemo } from 'react'
import type { Book, BookStatus } from '../../../shared/types'
import { STATUS_LABEL, getStatus } from '../../../shared/types'
import BookCard from './BookCard'
import { sortBooks, type SortKey, type SortDir } from '../utils'

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

const SORT_LABELS: Record<SortKey, string> = {
  startDate: 'Inicio', endDate: 'Fin', title: 'Título',
  author: 'Autor', status: 'Estado', year: 'Año', score: 'Puntuación',
}
const SORT_KEYS: SortKey[] = ['startDate', 'endDate', 'title', 'author', 'status', 'year', 'score']

const STATUS_FILTERS: { value: BookStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'in-progress', label: STATUS_LABEL['in-progress'] },
  { value: 'finished', label: STATUS_LABEL.finished },
  { value: 'abandoned', label: STATUS_LABEL.abandoned },
  { value: 'pending', label: STATUS_LABEL.pending },
]

function SortDropdown({ value, dir, onChange, onToggleDir }: {
  value: SortKey; dir: SortDir; onChange: (k: SortKey) => void; onToggleDir: () => void
}): React.JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <div className={`sort-dropdown${open ? ' open' : ''}`}>
      <div className="sort-control">
        <button className="sort-field-btn" onClick={() => setOpen((o) => !o)}>
          {SORT_LABELS[value]}<ChevronDownIcon />
        </button>
        <button className="sort-dir-btn" onClick={onToggleDir} title={dir === 'asc' ? 'Ascendente' : 'Descendente'}>
          {dir === 'asc' ? '↑' : '↓'}
        </button>
      </div>
      {open && (
        <>
          <div className="sort-dropdown-backdrop" onClick={() => setOpen(false)} />
          <div className="sort-dropdown-menu">
            {SORT_KEYS.map((k) => (
              <button key={k} className={`sort-dropdown-item${value === k ? ' active' : ''}`} onClick={() => { onChange(k); setOpen(false) }}>
                {SORT_LABELS[k]}{value === k && <CheckIcon />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function TagFilterDropdown({ allTags, selected, onChange }: {
  allTags: string[]; selected: Set<string>; onChange: (tags: Set<string>) => void
}): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const toggle = (tag: string): void => {
    const next = new Set(selected)
    if (next.has(tag)) next.delete(tag); else next.add(tag)
    onChange(next)
  }
  const count = selected.size
  return (
    <div className={`tag-filter-dropdown${open ? ' open' : ''}`}>
      <button className={`btn-filter tag-filter-btn${count > 0 ? ' active' : ''}`} onClick={() => setOpen((o) => !o)}>
        Tags{count > 0 ? ` (${count})` : ''}<ChevronDownIcon />
      </button>
      {open && (
        <>
          <div className="sort-dropdown-backdrop" onClick={() => setOpen(false)} />
          <div className="tag-filter-menu">
            {allTags.length === 0 ? (
              <span className="tag-filter-empty">Sin tags registrados</span>
            ) : (
              allTags.map((tag) => (
                <button key={tag} className={`tag-filter-item${selected.has(tag) ? ' active' : ''}`} onClick={() => toggle(tag)}>
                  <span className="tag-filter-check">{selected.has(tag) ? '✓' : ''}</span>{tag}
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

interface Props {
  books: Book[]
  allTags: string[]
  onSelectBook: (id: string) => void
}

export default function CatalogView({ books, allTags, onSelectBook }: Props): React.JSX.Element {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<BookStatus | 'all'>('all')
  const [tagFilter, setTagFilter] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>('startDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const filtered = useMemo(() => {
    let result = books
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
    }
    if (statusFilter !== 'all') result = result.filter((b) => getStatus(b) === statusFilter)
    if (tagFilter.size > 0) result = result.filter((b) => b.tags?.some((t) => tagFilter.has(t)))
    return sortBooks(result, sortKey, sortDir)
  }, [books, search, statusFilter, tagFilter, sortKey, sortDir])

  return (
    <div className="catalog-view">
      <div className="catalog-toolbar">
        <input type="search" placeholder="Buscar por título o autor..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="filter-group">
          {STATUS_FILTERS.map((f) => (
            <button key={f.value} className={`btn-filter ${statusFilter === f.value ? 'active' : ''}`} onClick={() => setStatusFilter(f.value)}>
              {f.label}
            </button>
          ))}
          <TagFilterDropdown allTags={allTags} selected={tagFilter} onChange={setTagFilter} />
        </div>
        <div className="catalog-toolbar-end">
          <SortDropdown value={sortKey} dir={sortDir} onChange={setSortKey} onToggleDir={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))} />
        </div>
      </div>
      <div className="catalog-scroll">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>{search || statusFilter !== 'all' || tagFilter.size > 0 ? 'No se encontraron resultados.' : 'No hay libros. Agrega el primero.'}</p>
          </div>
        ) : (
          <div className="book-grid">
            {filtered.map((book) => <BookCard key={book.id} book={book} onClick={() => onSelectBook(book.id)} />)}
          </div>
        )}
      </div>
    </div>
  )
}

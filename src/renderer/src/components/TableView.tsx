import React, { useState, useMemo } from 'react'
import type { Book, BookStatus } from '../../../shared/types'
import { getStatus, STATUS_LABEL } from '../../../shared/types'
import { formatDate, formatAuthor, fmtWords, sortBooks, daysBetween, WORDS_PER_LINE, type SortKey, type SortDir } from '../utils'

type MetricKey = 'days' | 'pages' | 'words' | 'pace' | 'score' | 'year' | 'startDate' | 'endDate' | 'readCount'

function calcMetric(book: Book, key: MetricKey): number | undefined {
  switch (key) {
    case 'days': {
      const r = [...book.readings].reverse().find((rd) => rd.endDate)
      if (!r?.endDate) return undefined
      return daysBetween(r.startDate, r.endDate)
    }
    case 'pages':
      return book.additionalData.pages
    case 'words': {
      const { pages, linesPerPage } = book.additionalData
      if (!pages || !linesPerPage) return undefined
      return pages * linesPerPage * WORDS_PER_LINE
    }
    case 'pace': {
      const r = [...book.readings].reverse().find((rd) => rd.endDate)
      if (!r?.endDate || !book.additionalData.pages) return undefined
      return book.additionalData.pages / daysBetween(r.startDate, r.endDate)
    }
    case 'score': return book.score
    case 'year': return book.year
    case 'startDate': { const d = book.readings[0]?.startDate; return d ? new Date(d).getTime() : undefined }
    case 'endDate': { const r = [...book.readings].reverse().find((rd) => rd.endDate); return r?.endDate ? new Date(r.endDate).getTime() : undefined }
    case 'readCount': return book.readings.length
  }
}

function sortByMetric(books: Book[], key: MetricKey, dir: SortDir): Book[] {
  return [...books].sort((a, b) => {
    const av = calcMetric(a, key)
    const bv = calcMetric(b, key)
    if (av === undefined && bv === undefined) return 0
    if (av === undefined) return 1
    if (bv === undefined) return -1
    const cmp = av - bv
    return dir === 'asc' ? cmp : -cmp
  })
}

const METRIC_LABELS: Record<MetricKey, string> = {
  days: 'Días', pages: 'Páginas', words: 'Palabras', pace: 'Ritmo',
  score: 'Puntuación', year: 'Año', startDate: 'Inicio', endDate: 'Fin', readCount: 'Lecturas',
}
const METRICS: MetricKey[] = ['days', 'pages', 'words', 'pace', 'score', 'year', 'startDate', 'endDate', 'readCount']
const STATUS_OPTIONS: BookStatus[] = ['in-progress', 'finished', 'pending', 'abandoned']
const COLUMN_SORT_KEYS: Record<'title' | 'author' | 'status', SortKey> = {
  title: 'title', author: 'author', status: 'status',
}

type ColumnKey = 'title' | 'author' | 'status' | MetricKey
type FilterKey = 'title' | 'status' | 'author'

function formatMetricDisplay(book: Book, key: MetricKey): string {
  switch (key) {
    case 'days': { const v = calcMetric(book, key); return v !== undefined ? `${v}d` : '—' }
    case 'pages': return book.additionalData.pages !== undefined ? String(book.additionalData.pages) : '—'
    case 'words': { const v = calcMetric(book, key); return v !== undefined ? fmtWords(v) : '—' }
    case 'pace': { const v = calcMetric(book, key); return v !== undefined ? `${v.toFixed(1)} p/d` : '—' }
    case 'score': return book.score !== undefined ? `★ ${book.score.toFixed(1)}` : '—'
    case 'year': return String(book.year)
    case 'startDate': return formatDate(book.readings[0]?.startDate)
    case 'endDate': { const r = [...book.readings].reverse().find((rd) => rd.endDate); return formatDate(r?.endDate) }
    case 'readCount': { const v = book.readings.length; return v === 1 ? '1 vez' : `${v} veces` }
  }
}

function StatusBadge({ status }: { status: BookStatus }): React.JSX.Element {
  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>
}

function FilterIcon(): React.JSX.Element {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}

function FilterPanel({ anchor, onClose, children }: {
  anchor: DOMRect; onClose: () => void; children: React.ReactNode
}): React.JSX.Element {
  return (
    <>
      <div className="filter-panel-backdrop" onClick={onClose} />
      <div className="filter-panel" style={{ top: anchor.bottom + 4, left: anchor.left }}>
        {children}
      </div>
    </>
  )
}

interface Props {
  books: Book[]
  onSelectBook: (id: string) => void
}

export default function TableView({ books, onSelectBook }: Props): React.JSX.Element {
  const [titleSearch, setTitleSearch] = useState('')
  const [activeMetric, setActiveMetric] = useState<MetricKey>('score')
  const [sortBy, setSortBy] = useState<ColumnKey>('score')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [statusFilter, setStatusFilter] = useState<Set<BookStatus>>(new Set())
  const [authorFilter, setAuthorFilter] = useState<Set<string>>(new Set())
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null)
  const [authorSearch, setAuthorSearch] = useState('')
  const [filterAnchor, setFilterAnchor] = useState<DOMRect | null>(null)

  const allAuthors = useMemo(() => {
    const set = new Set<string>()
    for (const b of books) set.add(b.author)
    return Array.from(set).sort((a, b) => formatAuthor(a).localeCompare(formatAuthor(b)))
  }, [books])

  const visibleAuthors = useMemo(() => {
    if (!authorSearch) return allAuthors
    const q = authorSearch.toLowerCase()
    return allAuthors.filter((a) => a.toLowerCase().includes(q) || formatAuthor(a).toLowerCase().includes(q))
  }, [allAuthors, authorSearch])

  const filtered = useMemo(() => {
    let result = books
    if (titleSearch) {
      const q = titleSearch.toLowerCase()
      result = result.filter((b) => b.title.toLowerCase().includes(q))
    }
    if (statusFilter.size > 0) result = result.filter((b) => statusFilter.has(getStatus(b)))
    if (authorFilter.size > 0) result = result.filter((b) => authorFilter.has(b.author))
    if (sortBy in COLUMN_SORT_KEYS) {
      return sortBooks(result, COLUMN_SORT_KEYS[sortBy as keyof typeof COLUMN_SORT_KEYS], sortDir)
    }
    return sortByMetric(result, sortBy as MetricKey, sortDir)
  }, [books, titleSearch, statusFilter, authorFilter, sortBy, sortDir])

  const { minVal, maxVal } = useMemo(() => {
    let min = Infinity; let max = -Infinity
    for (const b of filtered) {
      const v = calcMetric(b, activeMetric)
      if (v !== undefined) { if (v < min) min = v; if (v > max) max = v }
    }
    return { minVal: min === Infinity ? 0 : min, maxVal: max === -Infinity ? 0 : max }
  }, [filtered, activeMetric])

  const isDateMetric = activeMetric === 'startDate' || activeMetric === 'endDate' || activeMetric === 'year'
  const hasActiveFilters = titleSearch || statusFilter.size > 0 || authorFilter.size > 0

  const handleHeaderSort = (col: ColumnKey): void => {
    if (col === sortBy) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(col)
      setSortDir(col === 'title' || col === 'author' ? 'asc' : 'desc')
    }
  }

  const handleMetricSelect = (metric: MetricKey): void => {
    setActiveMetric(metric)
    setSortBy(metric)
    setSortDir('desc')
  }

  const openFilterPanel = (key: FilterKey, e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation()
    if (openFilter === key) { setOpenFilter(null); return }
    setFilterAnchor(e.currentTarget.getBoundingClientRect())
    setOpenFilter(key)
    if (key === 'author') setAuthorSearch('')
  }

  const toggleStatus = (s: BookStatus): void => {
    const next = new Set(statusFilter)
    if (next.has(s)) next.delete(s); else next.add(s)
    setStatusFilter(next)
  }

  const toggleAuthor = (a: string): void => {
    const next = new Set(authorFilter)
    if (next.has(a)) next.delete(a); else next.add(a)
    setAuthorFilter(next)
  }

  const sortIcon = (col: ColumnKey): React.JSX.Element | null =>
    sortBy === col ? <span className="sort-icon">{sortDir === 'asc' ? '↑' : '↓'}</span> : null

  return (
    <div className="table-view">
      <div className="metric-pills">
        {METRICS.map((m) => (
          <button key={m} className={`metric-pill${activeMetric === m ? ' active' : ''}`} onClick={() => handleMetricSelect(m)}>
            {METRIC_LABELS[m]}
          </button>
        ))}
      </div>
      <div className="catalog-scroll">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>{hasActiveFilters ? 'No se encontraron resultados.' : 'No hay libros. Agrega el primero.'}</p>
          </div>
        ) : (
          <table>
            <colgroup>
              <col />
              <col />
              <col />
              <col style={{ width: '40%' }} />
            </colgroup>
            <thead>
              <tr>
                <th className={sortBy === 'title' ? 'th-active' : ''} onClick={() => handleHeaderSort('title')}>
                  <div className="th-filter-header">
                    <span>Título {sortIcon('title')}</span>
                    <button className={`th-filter-btn${titleSearch ? ' active' : ''}`} onClick={(e) => openFilterPanel('title', e)}>
                      <FilterIcon />
                    </button>
                  </div>
                </th>
                <th className={sortBy === 'author' ? 'th-active' : ''} onClick={() => handleHeaderSort('author')}>
                  <div className="th-filter-header">
                    <span>Autor {sortIcon('author')}</span>
                    <button className={`th-filter-btn${authorFilter.size > 0 ? ' active' : ''}`} onClick={(e) => openFilterPanel('author', e)}>
                      <FilterIcon />
                    </button>
                  </div>
                </th>
                <th className={sortBy === 'status' ? 'th-active' : ''} onClick={() => handleHeaderSort('status')}>
                  <div className="th-filter-header">
                    <span>Estado {sortIcon('status')}</span>
                    <button className={`th-filter-btn${statusFilter.size > 0 ? ' active' : ''}`} onClick={(e) => openFilterPanel('status', e)}>
                      <FilterIcon />
                    </button>
                  </div>
                </th>
                <th className={`th-metric${sortBy === activeMetric ? ' th-active' : ''}`} onClick={() => handleHeaderSort(activeMetric)}>
                  {METRIC_LABELS[activeMetric]} {sortIcon(activeMetric)}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((book) => {
                const v = calcMetric(book, activeMetric)
                const pct = v !== undefined
                  ? isDateMetric
                    ? maxVal > minVal ? ((v - minVal) / (maxVal - minVal)) * 100 : 100
                    : maxVal > 0 ? (v / maxVal) * 100 : 0
                  : 0
                return (
                  <tr key={book.id} onClick={() => onSelectBook(book.id)}>
                    <td>{book.title}</td>
                    <td className="td-muted td-nowrap">{formatAuthor(book.author)}</td>
                    <td className="td-nowrap"><StatusBadge status={getStatus(book)} /></td>
                    <td className="metric-bar-cell">
                      <div className="metric-bar-fill" style={{ width: `${pct}%` }} />
                      <span className="metric-bar-text">{formatMetricDisplay(book, activeMetric)}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {openFilter && filterAnchor && (
        <FilterPanel anchor={filterAnchor} onClose={() => setOpenFilter(null)}>
          {openFilter === 'title' && (
            <>
              <div className="filter-panel-search" style={{ padding: '8px' }}>
                <input type="search" placeholder="Filtrar por título..." value={titleSearch} onChange={(e) => setTitleSearch(e.target.value)} autoFocus />
              </div>
              {titleSearch && (
                <button className="filter-panel-clear" onClick={() => setTitleSearch('')}>Limpiar</button>
              )}
            </>
          )}
          {openFilter === 'status' && (
            <div className="filter-panel-list">
              {STATUS_OPTIONS.map((s) => (
                <label key={s} className="filter-panel-option">
                  <input type="checkbox" checked={statusFilter.has(s)} onChange={() => toggleStatus(s)} />
                  <StatusBadge status={s} />
                </label>
              ))}
              {statusFilter.size > 0 && (
                <button className="filter-panel-clear" onClick={() => setStatusFilter(new Set())}>Limpiar</button>
              )}
            </div>
          )}
          {openFilter === 'author' && (
            <>
              <div className="filter-panel-search">
                <input type="search" placeholder="Buscar autor..." value={authorSearch} onChange={(e) => setAuthorSearch(e.target.value)} autoFocus />
              </div>
              <div className="filter-panel-list">
                {visibleAuthors.map((a) => (
                  <label key={a} className="filter-panel-option">
                    <input type="checkbox" checked={authorFilter.has(a)} onChange={() => toggleAuthor(a)} />
                    <span>{formatAuthor(a)}</span>
                  </label>
                ))}
                {visibleAuthors.length === 0 && <div className="filter-panel-empty">Sin resultados</div>}
              </div>
              {authorFilter.size > 0 && (
                <button className="filter-panel-clear" onClick={() => setAuthorFilter(new Set())}>
                  Limpiar ({authorFilter.size})
                </button>
              )}
            </>
          )}
        </FilterPanel>
      )}
    </div>
  )
}

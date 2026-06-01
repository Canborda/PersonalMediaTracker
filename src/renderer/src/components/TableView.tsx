import React, { useState, useMemo } from 'react'
import type { Book, BookStatus } from '../../../shared/types'
import { getStatus, STATUS_LABEL } from '../../../shared/types'
import { formatDate, formatAuthor, sortBooks, type SortKey, type SortDir } from '../utils'

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }): React.JSX.Element {
  return <span className="sort-icon">{active ? (dir === 'asc' ? '↑' : '↓') : '↕'}</span>
}

function StatusBadge({ status }: { status: BookStatus }): React.JSX.Element {
  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>
}

interface Props {
  books: Book[]
  onSelectBook: (id: string) => void
}

export default function TableView({ books, onSelectBook }: Props): React.JSX.Element {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('startDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const handleSort = (key: SortKey): void => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    let result = books
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
    }
    return sortBooks(result, sortKey, sortDir)
  }, [books, search, sortKey, sortDir])

  return (
    <div className="table-view">
      <div className="table-toolbar">
        <input type="search" placeholder="Buscar por título o autor..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="catalog-scroll">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>{search ? 'No se encontraron resultados.' : 'No hay libros. Agrega el primero.'}</p>
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
                <th className={sortKey === 'status' ? 'th-active' : ''} onClick={() => handleSort('status')}>Estado <SortIcon active={sortKey === 'status'} dir={sortDir} /></th>
                <th className={sortKey === 'title' ? 'th-active' : ''} onClick={() => handleSort('title')}>Título <SortIcon active={sortKey === 'title'} dir={sortDir} /></th>
                <th className={sortKey === 'author' ? 'th-active' : ''} onClick={() => handleSort('author')}>Autor <SortIcon active={sortKey === 'author'} dir={sortDir} /></th>
                <th className={sortKey === 'year' ? 'th-active' : ''} onClick={() => handleSort('year')}>Año <SortIcon active={sortKey === 'year'} dir={sortDir} /></th>
                <th className={sortKey === 'startDate' ? 'th-active' : ''} onClick={() => handleSort('startDate')}>Inicio <SortIcon active={sortKey === 'startDate'} dir={sortDir} /></th>
                <th className={sortKey === 'endDate' ? 'th-active' : ''} onClick={() => handleSort('endDate')}>Fin <SortIcon active={sortKey === 'endDate'} dir={sortDir} /></th>
                <th className={sortKey === 'score' ? 'th-active' : ''} onClick={() => handleSort('score')}>Punt. <SortIcon active={sortKey === 'score'} dir={sortDir} /></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((book) => (
                <tr key={book.id} onClick={() => onSelectBook(book.id)}>
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
  )
}

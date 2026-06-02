import React, { useMemo, useState, useEffect, useCallback } from 'react'
import type { Book, BookMeta } from '../../../shared/types'

function TagBookCard({ book, onSelect }: { book: Book; onSelect: (id: string) => void }): React.JSX.Element {
  const [meta, setMeta] = useState<BookMeta | null>(null)

  useEffect(() => {
    window.electron.getBookMeta(book.id).then(setMeta)
  }, [book.id])

  return (
    <li className="tag-book-card" onClick={() => onSelect(book.id)}>
      <div className="tag-book-card-cover">
        {meta?.cover
          ? <img src={meta.cover} alt={book.title} />
          : <span className="tag-book-card-letter">{book.title[0]?.toUpperCase()}</span>
        }
      </div>
      <div className="tag-book-card-info">
        <p className="tag-book-card-title">{book.title}</p>
        <p className="tag-book-card-author">{book.author}</p>
        <p className="tag-book-card-year">{book.year}</p>
      </div>
    </li>
  )
}

export default function TagsSection({ books, onSelectBook }: { books: Book[]; onSelectBook: (id: string) => void }): React.JSX.Element {
  const [openTags, setOpenTags] = useState<Set<string>>(new Set())

  const toggle = useCallback((tag: string) => {
    setOpenTags((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }, [])

  const groups = useMemo(() => {
    const map = new Map<string, Book[]>()
    for (const book of books) {
      for (const tag of book.tags ?? []) {
        const list = map.get(tag) ?? []
        list.push(book)
        map.set(tag, list)
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .map(([tag, tagBooks]) => ({ tag, books: tagBooks.slice().sort((a, b) => a.year - b.year) }))
  }, [books])

  if (groups.length === 0) {
    return <p className="stats-empty">Sin datos suficientes.</p>
  }

  return (
    <div className="tags-section">
      {groups.map(({ tag, books: tagBooks }) => {
        const isOpen = openTags.has(tag)
        return (
          <div key={tag} className={`tags-collapsible${isOpen ? ' tags-collapsible-open' : ''}`}>
            <button className="tags-collapsible-header" onClick={() => toggle(tag)}>
              <span className="tags-collapsible-name">{tag}</span>
              <span className="tags-collapsible-count">{tagBooks.length}</span>
              <span className={`tags-collapsible-chevron${isOpen ? ' open' : ''}`}>›</span>
            </button>
            <div className={`tags-collapsible-body${isOpen ? ' open' : ''}`}>
              <div className="tags-collapsible-inner">
                <ul className="tags-collapsible-books">
                  {tagBooks.map((b) => (
                    <TagBookCard key={b.id} book={b} onSelect={onSelectBook} />
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

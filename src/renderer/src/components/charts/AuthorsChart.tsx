import React, { useMemo, useState } from 'react'
import type { Book } from '../../../../shared/types'
import { formatAuthor, fmtWords, WORDS_PER_LINE } from '../../utils'

interface AuthorStat {
  author: string
  booksFinished: number
  totalWords: number
  totalPages: number
}

export default function AuthorsChart({ books }: { books: Book[] }): React.JSX.Element {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)

  const authors = useMemo(() => {
    const map = new Map<string, AuthorStat>()
    for (const book of books) {
      const completedCount = book.readings.filter((r) => r.completed === true).length
      if (completedCount === 0) continue
      const words = (book.additionalData.pages ?? 0) * (book.additionalData.linesPerPage ?? 30) * WORDS_PER_LINE
      const pages = book.additionalData.pages ?? 0
      const existing = map.get(book.author)
      if (existing) {
        existing.booksFinished += completedCount
        existing.totalWords += words * completedCount
        existing.totalPages += pages * completedCount
      } else {
        map.set(book.author, {
          author: book.author,
          booksFinished: completedCount,
          totalWords: words * completedCount,
          totalPages: pages * completedCount,
        })
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalWords - a.totalWords)
  }, [books])

  if (authors.length === 0) {
    return <p className="stats-empty">Sin datos suficientes.</p>
  }

  const maxWords = authors[0].totalWords
  const ha = hoveredIdx !== null ? authors[hoveredIdx] : null

  return (
    <div className="authors-chart">
      <div className="authors-rows">
        {authors.map((a, i) => (
          <div
            key={a.author}
            className={`authors-row${hoveredIdx === i ? ' hovered' : ''}`}
            onMouseEnter={(e) => { setHoveredIdx(i); setTooltipPos({ x: e.clientX, y: e.clientY }) }}
            onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
            onMouseLeave={() => { setHoveredIdx(null); setTooltipPos(null) }}
          >
            <span className="authors-label">{formatAuthor(a.author)}</span>
            <div className="authors-bar-track">
              <div
                className="authors-bar-fill"
                style={{ width: `${(a.totalWords / maxWords) * 100}%` }}
              />
            </div>
            <span className="authors-count">{a.booksFinished}</span>
          </div>
        ))}
      </div>

      {ha && tooltipPos && (
        <div
          className="stats-tooltip"
          style={{
            left: tooltipPos.x + 14 + 240 > window.innerWidth ? tooltipPos.x - 14 - 240 : tooltipPos.x + 14,
            top: tooltipPos.y - 56,
          }}
        >
          <div className="stats-tooltip-title">{formatAuthor(ha.author)}</div>
          <div className="stats-tooltip-row">
            <span>{ha.booksFinished} {ha.booksFinished === 1 ? 'libro terminado' : 'libros terminados'}</span>
          </div>
          <div className="stats-tooltip-row">
            <span>~{fmtWords(ha.totalWords)} palabras</span>
            <span className="stats-tooltip-muted">{ha.totalPages.toLocaleString('es-CO')} pág.</span>
          </div>
        </div>
      )}
    </div>
  )
}

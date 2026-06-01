import React, { useMemo } from 'react'
import type { Book } from '../../../shared/types'
import WPDChart, { buildSegments } from './charts/WPDChart'
import AuthorsChart from './charts/AuthorsChart'
import GenreChart from './charts/GenreChart'
import LanguageChart from './charts/LanguageChart'
import LongestBooksChart from './charts/LongestBooksChart'
import TagsChart from './charts/TagsChart'

export default function StatsView({ books }: { books: Book[] }): React.JSX.Element {
  const segments = useMemo(() => buildSegments(books), [books])

  return (
    <div className="stats-full-view">
      <div className="stats-full-grid">
        <div className="stats-full-cell">
          <span className="stats-section-title">Palabras por día</span>
          <WPDChart segments={segments} />
        </div>
        <div className="stats-full-cell">
          <span className="stats-section-title">Autores más leídos</span>
          <AuthorsChart books={books} />
        </div>
        <div className="stats-full-cell">
          <span className="stats-section-title">Libros más largos</span>
          <LongestBooksChart books={books} />
        </div>
        <div className="stats-full-cell">
          <span className="stats-section-title">Géneros</span>
          <GenreChart books={books} />
        </div>
        <div className="stats-full-cell">
          <span className="stats-section-title">Idioma original</span>
          <LanguageChart books={books} />
        </div>
        <div className="stats-full-cell">
          <span className="stats-section-title">Tags</span>
          <TagsChart books={books} />
        </div>
      </div>
    </div>
  )
}

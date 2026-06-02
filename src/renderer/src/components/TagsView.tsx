import React from 'react'
import type { Book } from '../../../shared/types'
import TagsSection from './TagsSection'

export default function TagsView({ books, onSelectBook }: { books: Book[]; onSelectBook: (id: string) => void }): React.JSX.Element {
  return (
    <div className="tags-view">
      <div className="tags-scroll">
        <TagsSection books={books} onSelectBook={onSelectBook} />
      </div>
    </div>
  )
}

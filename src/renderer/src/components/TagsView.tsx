import React from 'react'
import type { Book } from '../../../shared/types'
import TagsSection from './TagsSection'
import ViewHeader from './ViewHeader'
import { TagIcon } from '../icons'

export default function TagsView({ books, onSelectBook }: { books: Book[]; onSelectBook: (id: string) => void }): React.JSX.Element {
  return (
    <div className="tags-view">
      <ViewHeader title="Tags" icon={<TagIcon />} />
      <div className="tags-scroll">
        <TagsSection books={books} onSelectBook={onSelectBook} />
      </div>
    </div>
  )
}

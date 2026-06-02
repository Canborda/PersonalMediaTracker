import React, { useState, useEffect, useMemo } from 'react'
import type { Book } from '../../shared/types'
import BookForm from './components/BookForm'
import BookDetail from './components/BookDetail'
import SettingsModal from './components/SettingsModal'
import HomeView from './components/HomeView'
import CatalogView from './components/CatalogView'
import TableView from './components/TableView'
import StatsView from './components/StatsView'
import TagsView from './components/TagsView'
import { HomeIcon, GridIcon, ListIcon, StatsIcon, TagIcon, PlusIcon, SettingsIcon } from './icons'

type Tab = 'home' | 'catalog' | 'table' | 'stats' | 'tags'

const TAB_ICONS: Record<Tab, React.JSX.Element> = {
  home: <HomeIcon />,
  catalog: <GridIcon />,
  table: <ListIcon />,
  stats: <StatsIcon />,
  tags: <TagIcon />,
}

const TAB_TITLES: Record<Tab, string> = {
  home: 'Inicio',
  catalog: 'Catálogo',
  table: 'Tabla',
  stats: 'Estadísticas',
  tags: 'Tags',
}

const TABS: Tab[] = ['home', 'catalog', 'table', 'stats', 'tags']

function TabNav({ active, onSelect }: { active: Tab; onSelect: (t: Tab) => void }): React.JSX.Element {
  return (
    <nav className="tab-nav">
      {TABS.map((t) => (
        <button
          key={t}
          className={`tab-nav-item${active === t ? ' active' : ''}${t === 'home' ? ' tab-nav-home' : ''}`}
          onClick={() => onSelect(t)}
          data-tooltip={TAB_TITLES[t]}
        >
          {TAB_ICONS[t]}
        </button>
      ))}
    </nav>
  )
}

export default function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [homeKey, setHomeKey] = useState(0)
  const [books, setBooks] = useState<Book[]>([])
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    window.electron.getBooks().then(setBooks)
  }, [])

  const selectedBook = selectedBookId ? (books.find((b) => b.id === selectedBookId) ?? null) : null

  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const b of books) b.tags?.forEach((t) => set.add(t))
    return Array.from(set).sort()
  }, [books])

  const allAuthors = useMemo(() => {
    const set = new Set<string>()
    for (const b of books) set.add(b.author)
    return Array.from(set).sort()
  }, [books])

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

  const handleTabSelect = (tab: Tab): void => {
    if (tab === 'home') setHomeKey((k) => k + 1)
    setActiveTab(tab)
  }

  const openEdit = (book: Book): void => {
    setSelectedBookId(null)
    setEditingBook(book)
    setShowForm(true)
  }

  return (
    <div className="app">
      <TabNav active={activeTab} onSelect={handleTabSelect} />
      <div className="action-island">
        <button className="action-island-btn action-island-add" onClick={() => setShowForm(true)} data-tooltip="Agregar libro">
          <PlusIcon />
        </button>
        <button className="action-island-btn action-island-settings" onClick={() => setShowSettings(true)} data-tooltip="Ajustes">
          <SettingsIcon />
        </button>
      </div>
      <div className="tab-content">
        {activeTab === 'home' && (
          <HomeView
            key={homeKey}
            books={books}
            onSelectBook={setSelectedBookId}
          />
        )}
        {activeTab === 'catalog' && (
          <CatalogView books={books} allTags={allTags} onSelectBook={setSelectedBookId} />
        )}
        {activeTab === 'table' && (
          <TableView books={books} onSelectBook={setSelectedBookId} />
        )}
        {activeTab === 'stats' && <StatsView books={books} />}
        {activeTab === 'tags' && <TagsView books={books} onSelectBook={setSelectedBookId} />}
      </div>

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
          allAuthors={allAuthors}
        />
      )}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}

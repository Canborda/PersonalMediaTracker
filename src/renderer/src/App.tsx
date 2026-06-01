import React, { useState, useEffect, useMemo } from 'react'
import type { Book } from '../../shared/types'
import BookForm from './components/BookForm'
import BookDetail from './components/BookDetail'
import SettingsModal from './components/SettingsModal'
import HomeView from './components/HomeView'
import CatalogView from './components/CatalogView'
import TableView from './components/TableView'
import StatsView from './components/StatsView'

type Tab = 'home' | 'catalog' | 'table' | 'stats'

function HomeIcon(): React.JSX.Element {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function GridIcon(): React.JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}

function ListIcon(): React.JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}

function StatsIcon(): React.JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

const TAB_ICONS: Record<Tab, React.JSX.Element> = {
  home: <HomeIcon />,
  catalog: <GridIcon />,
  table: <ListIcon />,
  stats: <StatsIcon />,
}

const TAB_TITLES: Record<Tab, string> = {
  home: 'Inicio',
  catalog: 'Catálogo',
  table: 'Tabla',
  stats: 'Estadísticas',
}

const TABS: Tab[] = ['home', 'catalog', 'table', 'stats']

function TabNav({ active, onSelect }: { active: Tab; onSelect: (t: Tab) => void }): React.JSX.Element {
  return (
    <nav className="tab-nav">
      {TABS.map((t) => (
        <button
          key={t}
          className={`tab-nav-item${active === t ? ' active' : ''}`}
          onClick={() => onSelect(t)}
          title={TAB_TITLES[t]}
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
      <div className="tab-content">
        {activeTab === 'home' && (
          <HomeView
            key={homeKey}
            books={books}
            onAddBook={() => setShowForm(true)}
            onSettings={() => setShowSettings(true)}
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

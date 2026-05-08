import React, { useState, useEffect } from 'react'

function App(): React.JSX.Element {
  const [books, setBooks] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [dataDir, setDataDir] = useState('')

  useEffect(() => {
    window.electron.getBooks().then(setBooks)
    window.electron.getDataDir().then(setDataDir)
  }, [])

  const handleAdd = async (): Promise<void> => {
    if (!input.trim()) return
    const updated = await window.electron.addBook(input.trim())
    setBooks(updated)
    setInput('')
  }

  return (
    <div>
      <h1>Mis libros</h1>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Nombre del libro"
      />
      <button onClick={handleAdd}>Agregar libro</button>

      <ul>
        {books.map((book, i) => (
          <li key={i}>{book}</li>
        ))}
      </ul>

      <hr />

      <section>
        <p>{dataDir}</p>
        <button onClick={() => window.electron.openDataDir()}>Abrir en Finder</button>
      </section>
    </div>
  )
}

export default App

import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { randomUUID } from 'crypto'
import type { Book, BookMeta } from '../shared/types'

const dataDir = app.isPackaged
  ? join(app.getPath('userData'), 'data')
  : join(app.getAppPath(), 'data')

mkdirSync(dataDir, { recursive: true })

const dataPath = join(dataDir, 'books.json')
const metaPath = join(dataDir, 'books-meta.json')

function readBooks(): Book[] {
  if (!existsSync(dataPath)) return []
  try {
    const data = JSON.parse(readFileSync(dataPath, 'utf-8'))
    if (!Array.isArray(data) || (data.length > 0 && typeof data[0] !== 'object')) return []
    return data
  } catch {
    return []
  }
}

function writeBooks(books: Book[]): void {
  writeFileSync(dataPath, JSON.stringify(books, null, 2))
}

function readMeta(): Record<string, BookMeta> {
  if (!existsSync(metaPath)) return {}
  try {
    return JSON.parse(readFileSync(metaPath, 'utf-8'))
  } catch {
    return {}
  }
}

function writeMeta(meta: Record<string, BookMeta>): void {
  writeFileSync(metaPath, JSON.stringify(meta, null, 2))
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function splitLines(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if (lines.length >= maxLines) break
    const next = current ? `${current} ${word}` : word
    if (next.length <= maxChars) {
      current = next
    } else {
      if (current) lines.push(current)
      current = word.slice(0, maxChars)
    }
  }
  if (current && lines.length < maxLines) lines.push(current)
  return lines
}

function generatePlaceholder(title: string, author: string): string {
  const lines = splitLines(title, 18, 4)
  const startY = Math.max(100, 155 - lines.length * 11)
  const textEls = lines
    .map((l, i) =>
      `  <text x="110" y="${startY + i * 22}" font-family="sans-serif" font-size="13" fill="#d4d4ec" text-anchor="middle">${escapeXml(l)}</text>`
    )
    .join('\n')
  const authorY = startY + lines.length * 22 + 16
  const authorShort = author.length > 26 ? author.slice(0, 23) + '…' : author
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">',
    '  <defs>',
    '    <linearGradient id="spine" x1="0" y1="0" x2="0" y2="1">',
    '      <stop offset="0%" stop-color="#3b82f6"/>',
    '      <stop offset="100%" stop-color="#0ea5e9"/>',
    '    </linearGradient>',
    '  </defs>',
    '  <rect width="200" height="300" fill="#0f0f1a"/>',
    '  <rect x="0" y="0" width="14" height="300" fill="url(#spine)"/>',
    '  <rect x="14" y="0" width="1" height="300" fill="#3b82f6" opacity="0.25"/>',
    textEls,
    `  <text x="110" y="${authorY}" font-family="sans-serif" font-size="11" fill="#636380" text-anchor="middle" font-style="italic">${escapeXml(authorShort)}</text>`,
    '</svg>'
  ].join('\n')
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

async function fetchFromOpenLibrary(isbn: string, title: string, author: string): Promise<Partial<BookMeta>> {
  const result: Partial<BookMeta> = {}

  try {
    const bookRes = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (bookRes.ok) {
      const bookData = (await bookRes.json() as Record<string, unknown>)[`ISBN:${isbn}`] as Record<string, unknown> | undefined
      if (bookData) {
        const cover = bookData.cover as Record<string, string> | undefined
        if (cover?.large) result.cover = cover.large
        else if (cover?.medium) result.cover = cover.medium

        const pages = bookData.number_of_pages as number | undefined
        if (pages) result.pages = pages

        const works = bookData.works as Array<{ key: string }> | undefined
        if (works?.[0]?.key) {
          try {
            const workRes = await fetch(
              `https://openlibrary.org${works[0].key}.json`,
              { signal: AbortSignal.timeout(6000) }
            )
            if (workRes.ok) {
              const workData = await workRes.json() as Record<string, unknown>
              if (typeof workData.title === 'string') result.originalTitle = workData.title
              if (workData.description) {
                const d = workData.description as string | { value: string }
                result.description = typeof d === 'string' ? d : d.value
              }
            }
          } catch {}
        }
      }
    }
  } catch {}

  if (!result.cover || !result.originalTitle) {
    try {
      const searchRes = await fetch(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&limit=1`,
        { signal: AbortSignal.timeout(8000) }
      )
      if (searchRes.ok) {
        const hit = ((await searchRes.json() as { docs?: Array<Record<string, unknown>> }).docs ?? [])[0]
        if (hit) {
          if (!result.cover && hit.cover_i) result.cover = `https://covers.openlibrary.org/b/id/${hit.cover_i}-L.jpg`
          if (!result.originalTitle && typeof hit.title === 'string') result.originalTitle = hit.title
          if (!result.pages && typeof hit.number_of_pages_median === 'number') result.pages = hit.number_of_pages_median
          if (!result.description && typeof hit.key === 'string') {
            try {
              const workRes = await fetch(`https://openlibrary.org${hit.key}.json`, { signal: AbortSignal.timeout(6000) })
              if (workRes.ok) {
                const workData = await workRes.json() as Record<string, unknown>
                if (workData.description) {
                  const d = workData.description as string | { value: string }
                  result.description = typeof d === 'string' ? d : d.value
                }
              }
            } catch {}
          }
        }
      }
    } catch {}
  }

  return result
}

async function fetchFromGoogleBooks(isbn: string, title: string, author: string): Promise<Partial<BookMeta>> {
  const result: Partial<BookMeta> = {}
  const extractVolumeInfo = (info: Record<string, unknown>): void => {
    const imageLinks = info.imageLinks as { thumbnail?: string; smallThumbnail?: string } | undefined
    if (!result.cover) {
      if (imageLinks?.thumbnail) result.cover = imageLinks.thumbnail.replace('http:', 'https:')
      else if (imageLinks?.smallThumbnail) result.cover = imageLinks.smallThumbnail.replace('http:', 'https:')
    }
    if (!result.pages && typeof info.pageCount === 'number') result.pages = info.pageCount
    if (!result.description && typeof info.description === 'string') result.description = info.description
    if (!result.originalTitle && typeof info.title === 'string') result.originalTitle = info.title
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (res.ok) {
      const data = await res.json() as { items?: Array<{ volumeInfo: Record<string, unknown> }> }
      const info = data.items?.[0]?.volumeInfo
      if (info) extractVolumeInfo(info)
    }
  } catch {}

  if (!result.cover || !result.description) {
    try {
      const q = `intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(author)}`
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1`,
        { signal: AbortSignal.timeout(8000) }
      )
      if (res.ok) {
        const data = await res.json() as { items?: Array<{ volumeInfo: Record<string, unknown> }> }
        const info = data.items?.[0]?.volumeInfo
        if (info) extractVolumeInfo(info)
      }
    } catch {}
  }

  return result
}

function mergeBookMeta(book: Book, ol: Partial<BookMeta>, gb: Partial<BookMeta>): BookMeta {
  return {
    cover: ol.cover ?? gb.cover ?? generatePlaceholder(book.title, book.author),
    ...(ol.originalTitle ?? gb.originalTitle ? { originalTitle: ol.originalTitle ?? gb.originalTitle } : {}),
    ...(ol.description ?? gb.description ? { description: ol.description ?? gb.description } : {}),
    ...(ol.pages ?? gb.pages ? { pages: ol.pages ?? gb.pages } : {}),
  }
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  ipcMain.handle('get-books', () => readBooks())

  ipcMain.handle('add-book', (_, bookData: Omit<Book, 'id'>) => {
    const books = readBooks()
    books.push({ ...bookData, id: randomUUID() })
    writeBooks(books)
    return books
  })

  ipcMain.handle('update-book', (_, book: Book) => {
    const books = readBooks()
    const idx = books.findIndex((b) => b.id === book.id)
    if (idx !== -1) books[idx] = book
    writeBooks(books)
    return books
  })

  ipcMain.handle('delete-book', (_, id: string) => {
    const books = readBooks().filter((b) => b.id !== id)
    writeBooks(books)
    return books
  })

  ipcMain.handle('get-data-dir', () => dataDir)
  ipcMain.handle('open-data-dir', () => shell.openPath(dataDir))

  ipcMain.handle('get-book-meta', (_, id: string): BookMeta | null => {
    const meta = readMeta()
    return meta[id] ?? null
  })

  ipcMain.handle('fetch-book-meta', async (_, id: string): Promise<BookMeta> => {
    const book = readBooks().find((b) => b.id === id)
    if (!book) return {}

    const [ol, gb] = await Promise.all([
      fetchFromOpenLibrary(book.isbn, book.title, book.author),
      fetchFromGoogleBooks(book.isbn, book.title, book.author)
    ])

    const merged = mergeBookMeta(book, ol, gb)
    const meta = readMeta()
    meta[id] = merged
    writeMeta(meta)
    return merged
  })

  ipcMain.handle('fetch-all-meta', async (event): Promise<void> => {
    writeMeta({})
    const books = readBooks()
    const total = books.length

    for (let i = 0; i < books.length; i++) {
      const book = books[i]
      event.sender.send('fetch-all-meta-progress', { done: i, total, currentTitle: book.title })

      const [ol, gb] = await Promise.all([
        fetchFromOpenLibrary(book.isbn, book.title, book.author),
        fetchFromGoogleBooks(book.isbn, book.title, book.author)
      ])

      const merged = mergeBookMeta(book, ol, gb)
      const meta = readMeta()
      meta[book.id] = merged
      writeMeta(meta)
    }

    event.sender.send('fetch-all-meta-progress', { done: total, total, currentTitle: '' })
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

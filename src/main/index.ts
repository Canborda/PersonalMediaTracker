import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { randomUUID } from 'crypto'

interface ReadSession {
  startDate: string
  endDate?: string
}

interface Book {
  id: string
  title: string
  author: string
  year: number
  pages: number
  startDate?: string
  endDate?: string
  abandoned?: boolean
  rereads: ReadSession[]
}

const dataDir = app.isPackaged
  ? join(app.getPath('userData'), 'data')
  : join(app.getAppPath(), 'data')

mkdirSync(dataDir, { recursive: true })

const dataPath = join(dataDir, 'books.json')

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

  let settingsWin: BrowserWindow | null = null
  ipcMain.handle('open-settings', () => {
    if (settingsWin && !settingsWin.isDestroyed()) {
      settingsWin.focus()
      return
    }
    settingsWin = new BrowserWindow({
      width: 480,
      height: 200,
      resizable: false,
      minimizable: false,
      title: 'Settings',
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false
      }
    })
    settingsWin.on('closed', () => { settingsWin = null })
    if (process.env['ELECTRON_RENDERER_URL']) {
      settingsWin.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#settings`)
    } else {
      settingsWin.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'settings' })
    }
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

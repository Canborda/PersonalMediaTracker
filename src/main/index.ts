import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'

const dataDir = app.isPackaged
  ? join(app.getPath('userData'), 'data')
  : join(app.getAppPath(), 'data')

mkdirSync(dataDir, { recursive: true })

const dataPath = join(dataDir, 'books.json')

function readBooks(): string[] {
  if (!existsSync(dataPath)) return []
  return JSON.parse(readFileSync(dataPath, 'utf-8'))
}

function writeBooks(books: string[]): void {
  writeFileSync(dataPath, JSON.stringify(books, null, 2))
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  win.maximize()

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  ipcMain.handle('get-books', () => readBooks())

  ipcMain.handle('add-book', (_, title: string) => {
    const books = readBooks()
    books.push(title)
    writeBooks(books)
    return books
  })

  ipcMain.handle('get-data-dir', () => dataDir)

  ipcMain.handle('open-data-dir', () => shell.openPath(dataDir))

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

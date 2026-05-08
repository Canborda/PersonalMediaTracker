import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  getBooks: () => ipcRenderer.invoke('get-books'),
  addBook: (book: unknown) => ipcRenderer.invoke('add-book', book),
  updateBook: (book: unknown) => ipcRenderer.invoke('update-book', book),
  deleteBook: (id: string) => ipcRenderer.invoke('delete-book', id),
  getDataDir: () => ipcRenderer.invoke('get-data-dir'),
  openDataDir: () => ipcRenderer.invoke('open-data-dir'),
  getBookMeta: (id: string) => ipcRenderer.invoke('get-book-meta', id),
  fetchBookMeta: (id: string) => ipcRenderer.invoke('fetch-book-meta', id),
  fetchAllMeta: () => ipcRenderer.invoke('fetch-all-meta'),
  onFetchAllMetaProgress: (cb: (data: { done: number; total: number; currentTitle: string }) => void) => {
    ipcRenderer.removeAllListeners('fetch-all-meta-progress')
    ipcRenderer.on('fetch-all-meta-progress', (_event, data) => cb(data))
  },
  offFetchAllMetaProgress: () => ipcRenderer.removeAllListeners('fetch-all-meta-progress')
})

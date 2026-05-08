import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  getBooks: () => ipcRenderer.invoke('get-books'),
  addBook: (book: unknown) => ipcRenderer.invoke('add-book', book),
  updateBook: (book: unknown) => ipcRenderer.invoke('update-book', book),
  deleteBook: (id: string) => ipcRenderer.invoke('delete-book', id),
  getDataDir: () => ipcRenderer.invoke('get-data-dir'),
  openDataDir: () => ipcRenderer.invoke('open-data-dir'),
  openSettings: () => ipcRenderer.invoke('open-settings')
})

import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  getBooks: () => ipcRenderer.invoke('get-books'),
  addBook: (title: string) => ipcRenderer.invoke('add-book', title),
  getDataDir: () => ipcRenderer.invoke('get-data-dir'),
  openDataDir: () => ipcRenderer.invoke('open-data-dir')
})

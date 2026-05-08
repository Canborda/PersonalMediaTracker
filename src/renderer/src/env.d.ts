export {}

declare global {
  interface Window {
    electron: {
      getBooks: () => Promise<string[]>
      addBook: (title: string) => Promise<string[]>
      getDataDir: () => Promise<string>
      openDataDir: () => Promise<void>
    }
  }
}

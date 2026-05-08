import React, { useEffect, useRef, useState } from 'react'

interface Props {
  onClose: () => void
}

interface FetchProgress {
  done: number
  total: number
  currentTitle: string
}

export default function InfoModal({ onClose }: Props): React.JSX.Element {
  const [dataDir, setDataDir] = useState('')
  const [fetchingAll, setFetchingAll] = useState(false)
  const [progress, setProgress] = useState<FetchProgress | null>(null)

  useEffect(() => {
    window.electron.getDataDir().then(setDataDir)
    return () => {
      window.electron.offFetchAllMetaProgress()
    }
  }, [])

  const isMounted = useRef(true)
  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  const handleFetchAll = async (): Promise<void> => {
    setFetchingAll(true)
    setProgress({ done: 0, total: 0, currentTitle: '' })
    window.electron.onFetchAllMetaProgress((data) => {
      if (isMounted.current) setProgress(data)
    })
    try {
      await window.electron.fetchAllMeta()
    } finally {
      window.electron.offFetchAllMetaProgress()
      if (isMounted.current) setFetchingAll(false)
    }
  }

  const isDone = progress !== null && !fetchingAll && progress.total > 0 && progress.done >= progress.total
  const pct = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal info-modal">
        <div className="info-header">
          <h2>Info</h2>
          <button className="btn-icon info-close" onClick={onClose}>×</button>
        </div>

        <div className="info-section">
          <span className="info-label">Carpeta de datos</span>
          <span className="info-value">{dataDir || '—'}</span>
          <button className="btn-ghost info-finder-btn" onClick={() => window.electron.openDataDir()}>
            Abrir en Finder
          </button>
        </div>

        <div className="info-divider" />

        <div className="info-section">
          <span className="info-label">Metadatos</span>
          <span className="info-hint">
            Borra el caché actual y busca portada, título original, sinopsis y páginas para todos los libros, uno por uno. Los libros sin ISBN se buscan por título y autor.
          </span>
          <button
            className="btn-ghost info-finder-btn"
            onClick={handleFetchAll}
            disabled={fetchingAll}
          >
            {fetchingAll ? 'Obteniendo metadatos...' : 'Actualizar todos los metadatos'}
          </button>
          {progress !== null && (
            <div className="fetch-all-progress">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="progress-stats">
                <span className="progress-count">
                  {isDone ? 'Completado' : `${progress.done} / ${progress.total}`}
                </span>
                {!isDone && progress.currentTitle && (
                  <span className="progress-title">{progress.currentTitle}</span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="info-divider" />

        <div className="info-section">
          <span className="info-label">Fuentes de metadatos</span>
          <span className="info-hint">
            La portada, el título original, la sinopsis y las páginas se obtienen consultando estas APIs en orden:
          </span>
        </div>

        <div className="api-list">
          <div className="api-item">
            <div className="api-header">
              <span className="api-name">Open Library</span>
              <span className="api-url">openlibrary.org</span>
            </div>
            <span className="api-desc">Catálogo abierto y colaborativo. Primera fuente; busca por ISBN y si no encuentra, por título y autor.</span>
          </div>
          <div className="api-item">
            <div className="api-header">
              <span className="api-name">Google Books</span>
              <span className="api-url">books.google.com</span>
            </div>
            <span className="api-desc">Base de datos de Google. Complementa los campos que Open Library no encuentra.</span>
          </div>
        </div>
      </div>
    </div>
  )
}

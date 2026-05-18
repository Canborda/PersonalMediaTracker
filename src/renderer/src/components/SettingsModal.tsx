import React, { useEffect, useRef, useState } from 'react'

interface Props {
  onClose: () => void
}

interface FetchProgress {
  done: number
  total: number
  currentTitle: string
}

export default function SettingsModal({ onClose }: Props): React.JSX.Element {
  const [dataDir, setDataDir] = useState('')
  const [fetchingAll, setFetchingAll] = useState(false)
  const [progress, setProgress] = useState<FetchProgress | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [savedApiKey, setSavedApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    window.electron.getDataDir().then(setDataDir)
    window.electron.getApiKey().then((k) => { setApiKey(k); setSavedApiKey(k) })
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

  const handleSaveKey = async (): Promise<void> => {
    const trimmed = apiKey.trim()
    await window.electron.setApiKey(trimmed)
    setSavedApiKey(trimmed)
    setApiKey(trimmed)
  }

  const handleClearKey = async (): Promise<void> => {
    await window.electron.setApiKey('')
    setSavedApiKey('')
    setApiKey('')
    setShowKey(false)
  }

  const isDone = progress !== null && !fetchingAll && progress.total > 0 && progress.done >= progress.total
  const pct = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal settings-modal">
        <div className="settings-header">
          <h2>Ajustes</h2>
          <button className="btn-icon settings-close" onClick={onClose}>×</button>
        </div>

        <div className="settings-section">
          <span className="settings-label">Carpeta de datos</span>
          <span className="settings-value">{dataDir || '—'}</span>
          <button className="btn-ghost settings-finder-btn" onClick={() => window.electron.openDataDir()}>
            Abrir en Finder
          </button>
        </div>

        <div className="settings-divider" />

        <div className="settings-section">
          <span className="settings-label">Fuentes de metadatos</span>
          <span className="settings-hint">
            La portada, la sinopsis y los temas se obtienen consultando estas APIs en paralelo:
          </span>
        </div>

        <div className="api-list">
          <div className="api-item">
            <div className="api-header">
              <span className="api-name">Open Library</span>
              <span className="api-url">openlibrary.org</span>
            </div>
            <span className="api-desc">Catálogo abierto y colaborativo. Busca primero por título original, luego por título y por último por ISBN.</span>
          </div>
          <div className="api-item">
            <div className="api-header">
              <span className="api-name">Google Books</span>
              <span className="api-url">books.google.com</span>
            </div>
            <span className="api-desc">Complementa los campos que Open Library no encuentra.</span>
            <div className="api-key-row">
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="API Key · AIzaSy..."
                autoComplete="off"
                spellCheck={false}
                className={showKey ? undefined : 'api-key-masked'}
              />
              <button type="button" className="btn-icon api-key-toggle" onClick={() => setShowKey((v) => !v)} title={showKey ? 'Ocultar' : 'Mostrar'}>
                {showKey ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
              <button
                className="btn-ghost"
                onClick={handleSaveKey}
                disabled={apiKey.trim() === savedApiKey}
              >
                Guardar
              </button>
              {savedApiKey && (
                <button className="btn-ghost api-key-clear" onClick={handleClearKey}>
                  Borrar
                </button>
              )}
            </div>
            {savedApiKey && apiKey.trim() === savedApiKey && (
              <span className="api-key-saved">Guardada ✓</span>
            )}
          </div>
        </div>

        <div className="settings-divider" />

        <div className="settings-section">
          <span className="settings-label">Metadatos</span>
          <span className="settings-hint">
            Borra el caché actual y busca portada, sinopsis y temas para todos los libros, uno por uno.
          </span>
          <button
            className="btn-ghost settings-finder-btn"
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
      </div>
    </div>
  )
}

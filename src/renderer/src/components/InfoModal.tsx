import React, { useEffect, useState } from 'react'

interface Props {
  onClose: () => void
}

export default function InfoModal({ onClose }: Props): React.JSX.Element {
  const [dataDir, setDataDir] = useState('')

  useEffect(() => {
    window.electron.getDataDir().then(setDataDir)
  }, [])

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

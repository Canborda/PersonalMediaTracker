import React, { useEffect, useState } from 'react'

export default function SettingsWindow(): React.JSX.Element {
  const [dataDir, setDataDir] = useState('')

  useEffect(() => {
    window.electron.getDataDir().then(setDataDir)
  }, [])

  return (
    <div className="settings-page">
      <h2>Settings</h2>
      <div className="settings-row">
        <span className="settings-label">Carpeta de datos</span>
        <span className="settings-value">{dataDir}</span>
      </div>
      <button className="btn-ghost" onClick={() => window.electron.openDataDir()}>
        Abrir en Finder
      </button>
    </div>
  )
}

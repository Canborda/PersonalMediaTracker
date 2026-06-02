import React from 'react'

export default function ViewHeader({ title, icon }: { title: string; icon: React.JSX.Element }): React.JSX.Element {
  return (
    <div className="view-header">
      <div className="view-header-row">
        <span className="view-header-icon">{icon}</span>
        <span className="view-header-title">{title}</span>
      </div>
      <div className="view-header-divider" />
    </div>
  )
}

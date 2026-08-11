import { useState } from 'react'
import '../styles/dashboard.css'

const SECTIONS = [
  { key: 'search', label: 'Search' },
  { key: 'new-entry', label: 'New Entry' },
  { key: 'forms', label: 'Forms' }
]

export default function Dashboard({ user, onLogout }) {
  const [activeSection, setActiveSection] = useState('search')

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>simply-track</h1>
        <div className="dashboard-user">
          <span>{user?.username}</span>
          <button onClick={onLogout}>Log out</button>
        </div>
      </header>

      <nav className="dashboard-nav">
        {SECTIONS.map((section) => (
          <button
            key={section.key}
            className={activeSection === section.key ? 'active' : ''}
            onClick={() => setActiveSection(section.key)}
          >
            {section.label}
          </button>
        ))}
      </nav>

      <main className="dashboard-content">
        {activeSection === 'search' && (
          <p>Search across every stored field, including repeat/duplicate entries. Coming in Phase 3.</p>
        )}
        {activeSection === 'new-entry' && (
          <p>Intake form for creating a new entry, using whichever template you pick. Coming in Phase 2.</p>
        )}
        {activeSection === 'forms' && (
          <p>Build custom fields and save/manage form templates here. Coming in Phase 4.</p>
        )}
      </main>
    </div>
  )
}

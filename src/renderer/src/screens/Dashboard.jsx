import { useState } from 'react'
import SearchPanel from './SearchPanel.jsx'
import NewEntryForm from './NewEntryForm.jsx'
import TemplateManager from './TemplateManager.jsx'
import Settings from './Settings.jsx'
import '../styles/dashboard.css'

const SECTIONS = [
  { key: 'search', label: 'Search' },
  { key: 'new-entry', label: 'New Entry' },
  { key: 'forms', label: 'Forms' },
  { key: 'settings', label: 'Settings' }
]

export default function Dashboard({ user, onLogout }) {
  const [activeSection, setActiveSection] = useState('search')

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>simply-track</h1>
        <div className="dashboard-user">
          <span>{user?.username}</span>
          <button className="btn" onClick={onLogout}>
            Log out
          </button>
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
        {activeSection === 'search' && <SearchPanel />}
        {activeSection === 'new-entry' && <NewEntryForm user={user} />}
        {activeSection === 'forms' && <TemplateManager />}
        {activeSection === 'settings' && <Settings />}
      </main>
    </div>
  )
}

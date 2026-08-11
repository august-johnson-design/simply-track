import { useEffect, useRef, useState } from 'react'
import EntryCard from '../components/EntryCard.jsx'
import '../styles/search-panel.css'

const DEBOUNCE_MS = 250

export default function SearchPanel() {
  const [template, setTemplate] = useState(null)
  const [query, setQuery] = useState('')
  const [entries, setEntries] = useState([])
  const [status, setStatus] = useState('loading') // loading | idle
  const debounceRef = useRef(null)

  useEffect(() => {
    window.api.templates.getDefault().then(setTemplate)
    loadRecent()

    return () => clearTimeout(debounceRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function loadRecent() {
    setStatus('loading')
    window.api.entries.list().then((results) => {
      setEntries(results)
      setStatus('idle')
    })
  }

  function runSearch(keyword) {
    setStatus('loading')
    window.api.entries.search(keyword).then((results) => {
      setEntries(results)
      setStatus('idle')
    })
  }

  function handleQueryChange(event) {
    const value = event.target.value
    setQuery(value)

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (value.trim()) {
        runSearch(value)
      } else {
        loadRecent()
      }
    }, DEBOUNCE_MS)
  }

  function handleUpdated(updatedEntry) {
    setEntries((prev) => prev.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry)))
  }

  function handleDeleted(id) {
    setEntries((prev) => prev.filter((entry) => entry.id !== id))
  }

  const trimmedQuery = query.trim()

  return (
    <div className="search-panel">
      <input
        type="search"
        className="search-panel-input"
        placeholder="Search by any field…"
        value={query}
        onChange={handleQueryChange}
        aria-label="Search entries"
      />

      {status === 'loading' && <p className="search-panel-status">Searching…</p>}

      {status === 'idle' && entries.length === 0 && (
        <p className="search-panel-status">
          {trimmedQuery ? 'No matching entries.' : 'No entries yet — add one from New Entry.'}
        </p>
      )}

      {status === 'idle' && entries.length > 0 && (
        <p className="search-panel-count">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          {trimmedQuery ? ' found' : ''}
        </p>
      )}

      <div className="search-panel-results">
        {entries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            fieldSchema={template?.field_schema}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
          />
        ))}
      </div>
    </div>
  )
}

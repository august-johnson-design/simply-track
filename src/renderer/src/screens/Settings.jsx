import { useState } from 'react'
import '../styles/settings.css'

// Backup/export is a single button: pick a destination, copy the database
// there via the main process's WAL-safe backup, report the result. No
// scheduling or restore UI yet — just a manual "get a safe copy of my data"
// escape hatch for non-technical users.
export default function Settings() {
  const [status, setStatus] = useState('idle') // idle | exporting | success | error
  const [message, setMessage] = useState('')

  async function handleExport() {
    setStatus('exporting')
    setMessage('')

    const result = await window.api.backup.export()

    if (result.canceled) {
      setStatus('idle')
      return
    }

    if (!result.success) {
      setStatus('error')
      setMessage(result.error || 'Could not export backup.')
      return
    }

    setStatus('success')
    setMessage(`Backup saved to ${result.path}`)
  }

  return (
    <div className="settings">
      <section className="settings-section">
        <h2>Backup</h2>
        <p className="settings-description">
          Save a copy of everything — clients, entries, and form templates — to a file you choose.
          You can use this file to restore your data later if something happens to this computer.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleExport}
          disabled={status === 'exporting'}
        >
          {status === 'exporting' ? 'Exporting…' : 'Export backup'}
        </button>
        {status === 'success' && <p className="form-success">{message}</p>}
        {status === 'error' && <p className="form-error">{message}</p>}
      </section>
    </div>
  )
}

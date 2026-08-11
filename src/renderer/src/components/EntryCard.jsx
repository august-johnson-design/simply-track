import { useState } from 'react'
import EntryFieldInputs from './EntryFieldInputs.jsx'
import '../styles/entry-card.css'

// Shows one entry's full contents (every field, not a snippet), with
// inline edit/delete. Editing reuses EntryFieldInputs so it stays in sync
// with whatever the entry's template defines.
export default function EntryCard({ entry, fieldSchema, onUpdated, onDeleted }) {
  const [mode, setMode] = useState('view') // view | editing
  const [values, setValues] = useState(entry.data)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function startEdit() {
    setValues(entry.data)
    setError('')
    setMode('editing')
  }

  function cancelEdit() {
    setMode('view')
    setError('')
  }

  function handleChange(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave(event) {
    event.preventDefault()
    setError('')
    setBusy(true)

    const result = await window.api.entries.update({
      id: entry.id,
      templateId: entry.template_id,
      data: values
    })

    setBusy(false)

    if (!result.success) {
      setError(result.error || 'Could not save changes.')
      return
    }

    setMode('view')
    onUpdated(result.entry)
  }

  async function handleDelete() {
    if (!window.confirm('Delete this entry? This cannot be undone.')) return

    setBusy(true)
    const result = await window.api.entries.delete(entry.id)
    setBusy(false)

    if (!result.success) {
      setError('Could not delete entry.')
      return
    }

    onDeleted(entry.id)
  }

  if (mode === 'editing') {
    return (
      <form className="entry-card entry-card-editing" onSubmit={handleSave}>
        <EntryFieldInputs
          fieldSchema={fieldSchema}
          values={values}
          onChange={handleChange}
          idPrefix={`entry-${entry.id}-`}
        />

        {error && <p className="entry-form-error">{error}</p>}

        <div className="entry-card-actions">
          <button type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={cancelEdit} disabled={busy}>
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="entry-card">
      <dl className="entry-card-fields">
        {(fieldSchema ?? []).map((field) => (
          <div className="entry-card-field" key={field.key}>
            <dt>{field.label}</dt>
            <dd>{entry.data[field.key] || <span className="entry-card-empty">—</span>}</dd>
          </div>
        ))}
      </dl>

      {error && <p className="entry-form-error">{error}</p>}

      <div className="entry-card-actions">
        <button type="button" onClick={startEdit}>
          Edit
        </button>
        <button type="button" onClick={handleDelete} disabled={busy}>
          Delete
        </button>
      </div>
    </div>
  )
}

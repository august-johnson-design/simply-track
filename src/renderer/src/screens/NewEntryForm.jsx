import { useEffect, useState } from 'react'
import EntryFieldInputs, { emptyValuesFor } from '../components/EntryFieldInputs.jsx'
import '../styles/entry-form.css'

export default function NewEntryForm({ user }) {
  const [templates, setTemplates] = useState([])
  const [templateId, setTemplateId] = useState(null)
  const [values, setValues] = useState({})
  const [error, setError] = useState('')
  const [status, setStatus] = useState('loading') // loading | idle | submitting | success

  useEffect(() => {
    let cancelled = false

    window.api.templates.list().then((loadedTemplates) => {
      if (cancelled) return
      const initial = loadedTemplates.find((t) => t.is_default) ?? loadedTemplates[0] ?? null
      setTemplates(loadedTemplates)
      setTemplateId(initial?.id ?? null)
      setValues(emptyValuesFor(initial))
      setStatus('idle')
    })

    return () => {
      cancelled = true
    }
  }, [])

  const template = templates.find((t) => t.id === templateId) ?? null

  function handleTemplateChange(event) {
    const nextId = Number(event.target.value)
    const nextTemplate = templates.find((t) => t.id === nextId) ?? null
    setTemplateId(nextTemplate?.id ?? null)
    setValues(emptyValuesFor(nextTemplate))
    setError('')
    if (status === 'success') setStatus('idle')
  }

  function handleChange(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (status === 'success') setStatus('idle')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setStatus('submitting')

    const result = await window.api.entries.create({
      templateId,
      data: values,
      createdBy: user?.id ?? null
    })

    if (!result.success) {
      setStatus('idle')
      setError(result.error || 'Could not save entry.')
      return
    }

    setValues(emptyValuesFor(template))
    setStatus('success')
  }

  if (status === 'loading') {
    return <p className="entry-form-loading">Loading form…</p>
  }

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      {templates.length > 1 && (
        <div className="entry-form-field">
          <label htmlFor="entry-form-template">Form</label>
          <select id="entry-form-template" value={templateId ?? ''} onChange={handleTemplateChange}>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.is_default ? ' (default)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      <EntryFieldInputs fieldSchema={template?.field_schema} values={values} onChange={handleChange} />

      {error && <p className="entry-form-error">{error}</p>}
      {status === 'success' && <p className="entry-form-success">Entry saved.</p>}

      <button type="submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Saving…' : 'Save entry'}
      </button>
    </form>
  )
}

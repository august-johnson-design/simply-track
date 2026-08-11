import { useEffect, useState } from 'react'
import EntryFieldInputs, { emptyValuesFor } from '../components/EntryFieldInputs.jsx'
import '../styles/entry-form.css'

export default function NewEntryForm({ user }) {
  const [template, setTemplate] = useState(null)
  const [values, setValues] = useState({})
  const [error, setError] = useState('')
  const [status, setStatus] = useState('loading') // loading | idle | submitting | success

  useEffect(() => {
    let cancelled = false

    window.api.templates.getDefault().then((loadedTemplate) => {
      if (cancelled) return
      setTemplate(loadedTemplate)
      setValues(emptyValuesFor(loadedTemplate))
      setStatus('idle')
    })

    return () => {
      cancelled = true
    }
  }, [])

  function handleChange(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (status === 'success') setStatus('idle')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setStatus('submitting')

    const result = await window.api.entries.create({
      templateId: template?.id ?? null,
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
      <EntryFieldInputs fieldSchema={template?.field_schema} values={values} onChange={handleChange} />

      {error && <p className="entry-form-error">{error}</p>}
      {status === 'success' && <p className="entry-form-success">Entry saved.</p>}

      <button type="submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Saving…' : 'Save entry'}
      </button>
    </form>
  )
}

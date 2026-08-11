import { useEffect, useState } from 'react'
import '../styles/entry-form.css'

// Renders whatever fields the template defines — nothing here is hardcoded
// to "Name/Phone/Email/Notes". Phase 4's form builder only needs to change
// what's in the template's field_schema; this component doesn't change.
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
      {template?.field_schema?.map((field) => (
        <div className="entry-form-field" key={field.key}>
          <label htmlFor={field.key}>
            {field.label}
            {field.required && <span className="entry-form-required"> *</span>}
          </label>
          {field.type === 'textarea' ? (
            <textarea
              id={field.key}
              value={values[field.key] ?? ''}
              onChange={(event) => handleChange(field.key, event.target.value)}
              required={field.required}
            />
          ) : (
            <input
              id={field.key}
              type="text"
              value={values[field.key] ?? ''}
              onChange={(event) => handleChange(field.key, event.target.value)}
              required={field.required}
            />
          )}
        </div>
      ))}

      {error && <p className="entry-form-error">{error}</p>}
      {status === 'success' && <p className="entry-form-success">Entry saved.</p>}

      <button type="submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Saving…' : 'Save entry'}
      </button>
    </form>
  )
}

function emptyValuesFor(template) {
  const values = {}
  template?.field_schema?.forEach((field) => {
    values[field.key] = ''
  })
  return values
}

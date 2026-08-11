import { useState } from 'react'
import { slugifyFieldKey } from '../lib/slugifyFieldKey.js'
import '../styles/template-editor.css'

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Multi-line text' }
]

// Add/remove/reorder fields and set each one's type/required flag. A
// field's key is generated once (from its label) when it's added and never
// changes afterward, even if the label is edited later — so renaming a
// field never orphans data already stored under its original key.
export default function TemplateEditor({ initialTemplate, onSave, onCancel }) {
  const [name, setName] = useState(initialTemplate?.name ?? '')
  const [fields, setFields] = useState(initialTemplate?.field_schema ?? [])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function addField() {
    const existingKeys = fields.map((field) => field.key)
    const key = slugifyFieldKey('New Field', existingKeys)
    setFields((prev) => [...prev, { key, label: 'New Field', type: 'text', required: false }])
  }

  function updateField(index, changes) {
    setFields((prev) => prev.map((field, i) => (i === index ? { ...field, ...changes } : field)))
  }

  function removeField(index) {
    setFields((prev) => prev.filter((_, i) => i !== index))
  }

  function moveField(index, direction) {
    setFields((prev) => {
      const target = index + direction
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSaving(true)

    const result = await onSave({ name, fieldSchema: fields })

    setSaving(false)
    if (!result.success) {
      setError(result.error || 'Could not save template.')
    }
  }

  return (
    <form className="template-editor" onSubmit={handleSubmit}>
      <div className="template-editor-name">
        <label htmlFor="template-name">Template name</label>
        <input
          id="template-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>

      <div className="template-editor-fields">
        {fields.map((field, index) => (
          <div className="template-editor-field-row" key={field.key}>
            <input
              type="text"
              aria-label={`Field ${index + 1} label`}
              value={field.label}
              onChange={(event) => updateField(index, { label: event.target.value })}
              required
            />
            <select
              aria-label={`Field ${index + 1} type`}
              value={field.type}
              onChange={(event) => updateField(index, { type: event.target.value })}
            >
              {FIELD_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <label className="template-editor-required">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(event) => updateField(index, { required: event.target.checked })}
              />
              Required
            </label>
            <button
              type="button"
              className="btn"
              onClick={() => moveField(index, -1)}
              disabled={index === 0}
              aria-label={`Move ${field.label} up`}
            >
              ↑
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => moveField(index, 1)}
              disabled={index === fields.length - 1}
              aria-label={`Move ${field.label} down`}
            >
              ↓
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => removeField(index)}
              aria-label={`Remove ${field.label}`}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={addField} className="btn template-editor-add">
        Add field
      </button>

      {error && <p className="form-error">{error}</p>}

      <div className="template-editor-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save template'}
        </button>
        <button type="button" className="btn" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  )
}

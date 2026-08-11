import { useEffect, useState } from 'react'
import TemplateEditor from '../components/TemplateEditor.jsx'
import '../styles/template-manager.css'

export default function TemplateManager() {
  const [templates, setTemplates] = useState([])
  const [status, setStatus] = useState('loading') // loading | idle
  const [mode, setMode] = useState('list') // list | creating | editing
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTemplates()
  }, [])

  function loadTemplates() {
    setStatus('loading')
    window.api.templates.list().then((results) => {
      setTemplates(results)
      setStatus('idle')
    })
  }

  function startCreate() {
    setEditingTemplate(null)
    setError('')
    setMode('creating')
  }

  function startEdit(template) {
    setEditingTemplate(template)
    setError('')
    setMode('editing')
  }

  function cancelEdit() {
    setMode('list')
    setEditingTemplate(null)
  }

  async function handleSave({ name, fieldSchema }) {
    const result =
      mode === 'editing'
        ? await window.api.templates.update({ id: editingTemplate.id, name, fieldSchema })
        : await window.api.templates.create({ name, fieldSchema })

    if (result.success) {
      loadTemplates()
      setMode('list')
      setEditingTemplate(null)
    }

    return result
  }

  async function handleSetDefault(id) {
    setError('')
    const result = await window.api.templates.setDefault(id)
    if (!result.success) {
      setError(result.error || 'Could not set default.')
      return
    }
    loadTemplates()
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this template? This cannot be undone.')) return

    setError('')
    const result = await window.api.templates.delete(id)
    if (!result.success) {
      setError(result.error || 'Could not delete template.')
      return
    }
    loadTemplates()
  }

  if (mode === 'creating' || mode === 'editing') {
    return <TemplateEditor initialTemplate={editingTemplate} onSave={handleSave} onCancel={cancelEdit} />
  }

  return (
    <div className="template-manager">
      <button type="button" onClick={startCreate} className="btn btn-primary template-manager-new">
        New template
      </button>

      {error && <p className="form-error">{error}</p>}

      {status === 'loading' && <p className="status-text">Loading…</p>}

      {status === 'idle' && (
        <ul className="template-manager-list">
          {templates.map((template) => (
            <li className="template-manager-row" key={template.id}>
              <div className="template-manager-row-info">
                <span className="template-manager-row-name">{template.name}</span>
                {template.is_default ? <span className="template-manager-badge">Default</span> : null}
                <span className="template-manager-row-count">
                  {template.field_schema.length} field{template.field_schema.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="template-manager-row-actions">
                <button type="button" className="btn" onClick={() => startEdit(template)}>
                  Edit
                </button>
                {!template.is_default && (
                  <button type="button" className="btn" onClick={() => handleSetDefault(template.id)}>
                    Set default
                  </button>
                )}
                {!template.is_default && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleDelete(template.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

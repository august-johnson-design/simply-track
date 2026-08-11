import { getDb } from '../db/index.js'

const DEFAULT_TEMPLATE_NAME = 'Default Intake'

// Phase 2 ships with one fixed template. The renderer form is already
// data-driven off `field_schema`, so Phase 4's form builder just needs to
// let users edit/add rows here — the intake form itself won't need to change.
const DEFAULT_FIELDS = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'phone', label: 'Phone', type: 'text', required: false },
  { key: 'email', label: 'Email', type: 'text', required: false },
  { key: 'notes', label: 'Notes', type: 'textarea', required: false }
]

const VALID_FIELD_TYPES = ['text', 'textarea']

// Shared by the create/update IPC handlers (and covered directly by tests)
// so a malformed template can never get saved: every field needs a
// non-empty key/label, a recognized type, and keys must be unique within
// the template (they're what entry data gets stored under).
export function validateFieldSchema(fieldSchema) {
  if (!Array.isArray(fieldSchema) || fieldSchema.length === 0) {
    return 'At least one field is required.'
  }

  const seenKeys = new Set()

  for (const field of fieldSchema) {
    if (!field || typeof field.key !== 'string' || !field.key.trim()) {
      return 'Every field needs a key.'
    }
    if (typeof field.label !== 'string' || !field.label.trim()) {
      return 'Every field needs a label.'
    }
    if (!VALID_FIELD_TYPES.includes(field.type)) {
      return `Unknown field type: ${field.type}`
    }
    if (seenKeys.has(field.key)) {
      return `Duplicate field key: ${field.key}`
    }
    seenKeys.add(field.key)
  }

  return null
}

function deserialize(row) {
  if (!row) return null
  return { ...row, field_schema: JSON.parse(row.field_schema) }
}

// Called once on startup. Creates the default template if this is a fresh
// database; a no-op on every later startup.
export function ensureDefaultTemplate() {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM form_templates WHERE is_default = 1').get()
  if (existing) return deserialize(existing)

  const result = db
    .prepare('INSERT INTO form_templates (name, field_schema, is_default) VALUES (?, ?, 1)')
    .run(DEFAULT_TEMPLATE_NAME, JSON.stringify(DEFAULT_FIELDS))

  return getTemplate(result.lastInsertRowid)
}

export function getTemplate(id) {
  const db = getDb()
  return deserialize(db.prepare('SELECT * FROM form_templates WHERE id = ?').get(id))
}

export function getDefaultTemplate() {
  const db = getDb()
  return deserialize(db.prepare('SELECT * FROM form_templates WHERE is_default = 1').get())
}

export function listTemplates() {
  const db = getDb()
  return db.prepare('SELECT * FROM form_templates ORDER BY created_at').all().map(deserialize)
}

export function createTemplate({ name, fieldSchema }) {
  const db = getDb()
  const result = db
    .prepare('INSERT INTO form_templates (name, field_schema) VALUES (?, ?)')
    .run(name, JSON.stringify(fieldSchema))

  return getTemplate(result.lastInsertRowid)
}

export function updateTemplate(id, { name, fieldSchema }) {
  const db = getDb()
  const existing = getTemplate(id)
  if (!existing) return null

  db.prepare(
    "UPDATE form_templates SET name = ?, field_schema = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(name, JSON.stringify(fieldSchema), id)

  return getTemplate(id)
}

// Exactly one template is ever the default at a time — used both as the
// starting selection on New Entry and as the fallback when validating/
// rendering an entry whose own template_id is missing.
export function setDefaultTemplate(id) {
  const db = getDb()
  const existing = getTemplate(id)
  if (!existing) return null

  const setDefault = db.transaction((templateId) => {
    db.prepare('UPDATE form_templates SET is_default = 0 WHERE is_default = 1').run()
    db.prepare("UPDATE form_templates SET is_default = 1, updated_at = datetime('now') WHERE id = ?").run(
      templateId
    )
  })
  setDefault(id)

  return getTemplate(id)
}

export function deleteTemplate(id) {
  const db = getDb()
  const template = getTemplate(id)
  if (!template) {
    return { success: false, error: 'Template not found.' }
  }
  if (template.is_default) {
    return { success: false, error: 'Cannot delete the default template — set a different one as default first.' }
  }

  try {
    db.prepare('DELETE FROM form_templates WHERE id = ?').run(id)
    return { success: true }
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      return { success: false, error: 'Cannot delete a template that still has entries using it.' }
    }
    throw error
  }
}

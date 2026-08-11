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

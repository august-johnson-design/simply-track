import { getDb } from '../db/index.js'

function deserialize(row) {
  if (!row) return null
  return { ...row, data: JSON.parse(row.data) }
}

export function createEntry({ templateId, data, createdBy }) {
  const db = getDb()
  const result = db
    .prepare('INSERT INTO entries (template_id, data, created_by) VALUES (?, ?, ?)')
    .run(templateId ?? null, JSON.stringify(data), createdBy ?? null)

  return getEntry(result.lastInsertRowid)
}

export function getEntry(id) {
  const db = getDb()
  return deserialize(db.prepare('SELECT * FROM entries WHERE id = ?').get(id))
}

// Newest first — this is what both the (Phase 3) search results list and any
// future "recent entries" view will want by default. Ties on created_at are
// broken by id DESC — SQLite's datetime('now') only has second resolution,
// so entries created within the same second would otherwise sort unstably.
export function listEntries() {
  const db = getDb()
  return db
    .prepare('SELECT * FROM entries ORDER BY created_at DESC, id DESC')
    .all()
    .map(deserialize)
}

export function updateEntry(id, data) {
  const db = getDb()
  const existing = getEntry(id)
  if (!existing) return null

  db.prepare("UPDATE entries SET data = ?, updated_at = datetime('now') WHERE id = ?").run(
    JSON.stringify(data),
    id
  )

  return getEntry(id)
}

export function deleteEntry(id) {
  const db = getDb()
  const result = db.prepare('DELETE FROM entries WHERE id = ?').run(id)
  return result.changes > 0
}

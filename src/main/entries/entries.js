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

// Keyword search across every field value in every entry (not just a fixed
// set of columns) — matches the requirement that any field, on any entry,
// including repeat/duplicate clients, is searchable and returns the full
// entry, not a snippet. Uses json_each to check each value in the entry's
// data object individually, so a match on any one field is enough; this
// also means a search only ever matches field *values*, never JSON syntax
// or key names.
export function searchEntries(keyword) {
  const trimmed = (keyword ?? '').trim()
  if (!trimmed) return []

  const db = getDb()
  // Escape the user's own %, _, and \ so they're treated as literal
  // characters rather than LIKE wildcards.
  const escaped = trimmed.replace(/[\\%_]/g, (char) => `\\${char}`)
  const pattern = `%${escaped}%`

  return db
    .prepare(
      `SELECT * FROM entries
       WHERE EXISTS (
         SELECT 1 FROM json_each(entries.data)
         WHERE value LIKE ? ESCAPE '\\'
       )
       ORDER BY created_at DESC, id DESC`
    )
    .all(pattern)
    .map(deserialize)
}

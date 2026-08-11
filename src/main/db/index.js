import path from 'path'
import { app } from 'electron'
import Database from 'better-sqlite3'
import { schema } from './schema.js'

let db = null

function getDbPath() {
  // app.getPath('userData') is a per-OS, per-user directory that survives
  // app updates and is separate from the install location — the right place
  // for a local, single-file SQLite database.
  return path.join(app.getPath('userData'), 'simply-track.sqlite')
}

export function getDb() {
  if (db) return db

  db = new Database(getDbPath())
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(schema)

  return db
}

export function closeDb() {
  if (db) {
    db.close()
    db = null
  }
}

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { schema } from './schema.js'

// db/index.js reads its file location from Electron's app.getPath('userData').
// Point that at a fresh temp directory per test so each test gets an
// isolated, real SQLite file on disk.
let tmpDir

vi.mock('electron', () => ({
  app: {
    getPath: () => tmpDir
  }
}))

describe('db', () => {
  let dbModule

  beforeEach(async () => {
    vi.resetModules()
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'simply-track-db-test-'))
    dbModule = await import('./index.js')
  })

  afterEach(() => {
    dbModule.closeDb()
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('creates a sqlite file at the userData path', () => {
    dbModule.getDb()
    expect(fs.existsSync(path.join(tmpDir, 'simply-track.sqlite'))).toBe(true)
  })

  it('applies the schema: users, form_templates, entries tables exist', () => {
    const db = dbModule.getDb()
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((row) => row.name)

    expect(tables).toEqual(expect.arrayContaining(['users', 'form_templates', 'entries']))
  })

  it('enforces foreign keys', () => {
    const db = dbModule.getDb()
    expect(db.pragma('foreign_keys', { simple: true })).toBe(1)
  })

  it('reuses the same connection on repeated calls (singleton)', () => {
    const first = dbModule.getDb()
    const second = dbModule.getDb()
    expect(first).toBe(second)
  })

  it('closeDb allows a fresh connection to be opened afterwards', () => {
    const first = dbModule.getDb()
    dbModule.closeDb()
    const second = dbModule.getDb()
    expect(second).not.toBe(first)
  })

  it('the schema can be safely reapplied (idempotent CREATE IF NOT EXISTS)', () => {
    const db = dbModule.getDb()
    expect(() => db.exec(schema)).not.toThrow()
  })
})

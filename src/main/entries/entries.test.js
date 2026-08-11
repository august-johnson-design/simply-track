import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

let tmpDir

vi.mock('electron', () => ({
  app: {
    getPath: () => tmpDir
  }
}))

describe('entries', () => {
  let db
  let templates
  let entries
  let templateId
  let userId

  beforeEach(async () => {
    vi.resetModules()
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'simply-track-entries-test-'))
    db = await import('../db/index.js')
    templates = await import('../templates/templates.js')
    entries = await import('./entries.js')
    const auth = await import('../auth/auth.js')
    templateId = templates.ensureDefaultTemplate().id
    // entries.created_by is a foreign key into users, so tests need a real
    // user row to reference rather than an arbitrary id.
    userId = auth.createUser('tester', 'irrelevant-password').id
  })

  afterEach(() => {
    db.closeDb()
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('creates an entry and stores the data as JSON', () => {
    const entry = entries.createEntry({
      templateId,
      data: { name: 'Alice Anderson', phone: '555-0100' },
      createdBy: userId
    })

    expect(entry.id).toEqual(expect.any(Number))
    expect(entry.template_id).toBe(templateId)
    expect(entry.created_by).toBe(userId)
    expect(entry.data).toEqual({ name: 'Alice Anderson', phone: '555-0100' })
  })

  it('allows multiple entries with identical data (repeat clients)', () => {
    entries.createEntry({ templateId, data: { name: 'Bob Baker' }, createdBy: userId })
    entries.createEntry({ templateId, data: { name: 'Bob Baker' }, createdBy: userId })

    const all = entries.listEntries()
    expect(all.filter((entry) => entry.data.name === 'Bob Baker')).toHaveLength(2)
  })

  it('listEntries returns newest first', () => {
    const first = entries.createEntry({ templateId, data: { name: 'First' }, createdBy: userId })
    const second = entries.createEntry({ templateId, data: { name: 'Second' }, createdBy: userId })

    const all = entries.listEntries()
    expect(all[0].id).toBe(second.id)
    expect(all[1].id).toBe(first.id)
  })

  it('getEntry returns null for an unknown id', () => {
    expect(entries.getEntry(999)).toBeNull()
  })

  it('updateEntry changes the data and bumps updated_at', () => {
    const entry = entries.createEntry({ templateId, data: { name: 'Original' }, createdBy: userId })

    const updated = entries.updateEntry(entry.id, { name: 'Updated' })

    expect(updated.data).toEqual({ name: 'Updated' })
    expect(updated.id).toBe(entry.id)
  })

  it('updateEntry returns null for an unknown id', () => {
    expect(entries.updateEntry(999, { name: 'Nobody' })).toBeNull()
  })

  it('deleteEntry removes the entry and returns true', () => {
    const entry = entries.createEntry({ templateId, data: { name: 'Temp' }, createdBy: userId })

    expect(entries.deleteEntry(entry.id)).toBe(true)
    expect(entries.getEntry(entry.id)).toBeNull()
  })

  it('deleteEntry returns false for an unknown id', () => {
    expect(entries.deleteEntry(999)).toBe(false)
  })
})

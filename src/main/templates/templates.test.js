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

describe('templates', () => {
  let db
  let templates

  beforeEach(async () => {
    vi.resetModules()
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'simply-track-templates-test-'))
    db = await import('../db/index.js')
    templates = await import('./templates.js')
  })

  afterEach(() => {
    db.closeDb()
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('creates a default template on first call', () => {
    const template = templates.ensureDefaultTemplate()

    expect(template.is_default).toBe(1)
    expect(template.field_schema).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: 'name', required: true })])
    )
  })

  it('does not create a second default template on repeated calls', () => {
    const first = templates.ensureDefaultTemplate()
    const second = templates.ensureDefaultTemplate()

    expect(second.id).toBe(first.id)
    expect(templates.listTemplates()).toHaveLength(1)
  })

  it('getDefaultTemplate returns null before any template exists', () => {
    expect(templates.getDefaultTemplate()).toBeNull()
  })

  it('getDefaultTemplate returns the seeded template with field_schema parsed', () => {
    templates.ensureDefaultTemplate()

    const result = templates.getDefaultTemplate()

    expect(Array.isArray(result.field_schema)).toBe(true)
  })

  it('getTemplate returns null for an unknown id', () => {
    expect(templates.getTemplate(999)).toBeNull()
  })
})

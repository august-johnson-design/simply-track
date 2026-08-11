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

  describe('createTemplate / updateTemplate', () => {
    const FIELDS = [{ key: 'company', label: 'Company', type: 'text', required: true }]

    it('creates a non-default template', () => {
      const template = templates.createTemplate({ name: 'Vendor Intake', fieldSchema: FIELDS })

      expect(template.name).toBe('Vendor Intake')
      expect(template.is_default).toBe(0)
      expect(template.field_schema).toEqual(FIELDS)
    })

    it('updateTemplate changes name and field_schema', () => {
      const created = templates.createTemplate({ name: 'Vendor Intake', fieldSchema: FIELDS })
      const newFields = [...FIELDS, { key: 'notes', label: 'Notes', type: 'textarea', required: false }]

      const updated = templates.updateTemplate(created.id, { name: 'Vendors', fieldSchema: newFields })

      expect(updated.name).toBe('Vendors')
      expect(updated.field_schema).toHaveLength(2)
    })

    it('updateTemplate returns null for an unknown id', () => {
      expect(templates.updateTemplate(999, { name: 'X', fieldSchema: FIELDS })).toBeNull()
    })
  })

  describe('setDefaultTemplate', () => {
    it('moves the default flag from the old default to the new one', () => {
      const original = templates.ensureDefaultTemplate()
      const other = templates.createTemplate({
        name: 'Vendor Intake',
        fieldSchema: [{ key: 'company', label: 'Company', type: 'text', required: true }]
      })

      const updated = templates.setDefaultTemplate(other.id)

      expect(updated.is_default).toBe(1)
      expect(templates.getTemplate(original.id).is_default).toBe(0)
      expect(templates.getDefaultTemplate().id).toBe(other.id)
    })

    it('returns null for an unknown id', () => {
      expect(templates.setDefaultTemplate(999)).toBeNull()
    })
  })

  describe('deleteTemplate', () => {
    it('deletes a non-default, unused template', () => {
      const other = templates.createTemplate({
        name: 'Vendor Intake',
        fieldSchema: [{ key: 'company', label: 'Company', type: 'text', required: true }]
      })

      const result = templates.deleteTemplate(other.id)

      expect(result).toEqual({ success: true })
      expect(templates.getTemplate(other.id)).toBeNull()
    })

    it('refuses to delete the default template', () => {
      const defaultTemplate = templates.ensureDefaultTemplate()

      const result = templates.deleteTemplate(defaultTemplate.id)

      expect(result.success).toBe(false)
      expect(templates.getTemplate(defaultTemplate.id)).not.toBeNull()
    })

    it('refuses to delete a template that has entries using it', async () => {
      const other = templates.createTemplate({
        name: 'Vendor Intake',
        fieldSchema: [{ key: 'company', label: 'Company', type: 'text', required: true }]
      })
      const entries = await import('../entries/entries.js')
      entries.createEntry({ templateId: other.id, data: { company: 'Acme' }, createdBy: null })

      const result = templates.deleteTemplate(other.id)

      expect(result.success).toBe(false)
      expect(templates.getTemplate(other.id)).not.toBeNull()
    })

    it('returns an error for an unknown id', () => {
      const result = templates.deleteTemplate(999)
      expect(result.success).toBe(false)
    })
  })

  describe('validateFieldSchema', () => {
    it('accepts a well-formed schema', () => {
      expect(
        templates.validateFieldSchema([{ key: 'name', label: 'Name', type: 'text', required: true }])
      ).toBeNull()
    })

    it('rejects an empty schema', () => {
      expect(templates.validateFieldSchema([])).toBeTruthy()
      expect(templates.validateFieldSchema(null)).toBeTruthy()
    })

    it('rejects a field missing a label', () => {
      expect(templates.validateFieldSchema([{ key: 'name', type: 'text', required: true }])).toBeTruthy()
    })

    it('rejects an unknown field type', () => {
      expect(
        templates.validateFieldSchema([{ key: 'name', label: 'Name', type: 'date', required: false }])
      ).toBeTruthy()
    })

    it('rejects duplicate keys', () => {
      expect(
        templates.validateFieldSchema([
          { key: 'name', label: 'Name', type: 'text', required: true },
          { key: 'name', label: 'Full Name', type: 'text', required: false }
        ])
      ).toBeTruthy()
    })
  })
})

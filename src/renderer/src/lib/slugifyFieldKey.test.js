import { describe, it, expect } from 'vitest'
import { slugifyFieldKey } from './slugifyFieldKey.js'

describe('slugifyFieldKey', () => {
  it('lowercases and replaces spaces with underscores', () => {
    expect(slugifyFieldKey('Referred By')).toBe('referred_by')
  })

  it('strips punctuation', () => {
    expect(slugifyFieldKey("Client's Email!")).toBe('client_s_email')
  })

  it('trims leading/trailing underscores left by stripped punctuation', () => {
    expect(slugifyFieldKey('  Notes  ')).toBe('notes')
  })

  it('falls back to "field" for a label with no alphanumeric characters', () => {
    expect(slugifyFieldKey('***')).toBe('field')
  })

  it('appends a numeric suffix on collision with an existing key', () => {
    expect(slugifyFieldKey('Notes', ['notes'])).toBe('notes_2')
    expect(slugifyFieldKey('Notes', ['notes', 'notes_2'])).toBe('notes_3')
  })
})

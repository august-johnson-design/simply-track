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

describe('auth', () => {
  let db
  let auth

  beforeEach(async () => {
    vi.resetModules()
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'simply-track-auth-test-'))
    db = await import('../db/index.js')
    auth = await import('./auth.js')
  })

  afterEach(() => {
    db.closeDb()
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('hasAnyUser is false before any account exists', () => {
    expect(auth.hasAnyUser()).toBe(false)
  })

  it('createUser stores the account and hasAnyUser becomes true', () => {
    const user = auth.createUser('alice', 'correct-horse-battery')

    expect(user.username).toBe('alice')
    expect(typeof user.id).toBe('number')
    expect(auth.hasAnyUser()).toBe(true)
  })

  it('never stores the password in plaintext', () => {
    auth.createUser('alice', 'correct-horse-battery')

    const row = db
      .getDb()
      .prepare('SELECT password_hash FROM users WHERE username = ?')
      .get('alice')

    expect(row.password_hash).not.toBe('correct-horse-battery')
    // bcrypt hashes start with $2a$, $2b$, or $2y$
    expect(row.password_hash).toMatch(/^\$2[aby]\$/)
  })

  it('verifyLogin succeeds with the correct username and password', () => {
    auth.createUser('alice', 'correct-horse-battery')

    const result = auth.verifyLogin('alice', 'correct-horse-battery')

    expect(result.success).toBe(true)
    expect(result.user).toEqual({ id: expect.any(Number), username: 'alice' })
  })

  it('verifyLogin fails with the wrong password', () => {
    auth.createUser('alice', 'correct-horse-battery')

    const result = auth.verifyLogin('alice', 'wrong-password')

    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('verifyLogin fails for a username that does not exist', () => {
    const result = auth.verifyLogin('nobody', 'whatever')

    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('verifyLogin does not leak whether the username exists via the error message', () => {
    auth.createUser('alice', 'correct-horse-battery')

    const wrongPassword = auth.verifyLogin('alice', 'wrong-password')
    const unknownUser = auth.verifyLogin('nobody', 'whatever')

    expect(wrongPassword.error).toBe(unknownUser.error)
  })
})

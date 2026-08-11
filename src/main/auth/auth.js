import bcrypt from 'bcryptjs'
import { getDb } from '../db/index.js'

const SALT_ROUNDS = 10

export function hasAnyUser() {
  const db = getDb()
  const row = db.prepare('SELECT COUNT(*) AS count FROM users').get()
  return row.count > 0
}

export function createUser(username, password) {
  const db = getDb()
  const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS)
  const result = db
    .prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
    .run(username, passwordHash)

  return { id: result.lastInsertRowid, username }
}

export function verifyLogin(username, password) {
  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return { success: false, error: 'Invalid username or password.' }
  }

  return { success: true, user: { id: user.id, username: user.username } }
}

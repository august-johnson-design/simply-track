import { useState } from 'react'
import '../styles/auth.css'

export default function CreateFirstUser({ onCreated }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setSubmitting(true)
    const result = await window.api.auth.createFirstUser({ username, password })
    setSubmitting(false)

    if (!result.success) {
      setError(result.error || 'Could not create account.')
      return
    }

    onCreated(result.user)
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>simply-track</h1>
        <p className="auth-subtitle">Set up your login to get started</p>

        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoFocus
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <label htmlFor="confirmPassword">Confirm password</label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>

        <p className="auth-hint">
          This is stored only on this computer — no internet connection is used.
        </p>
      </form>
    </div>
  )
}

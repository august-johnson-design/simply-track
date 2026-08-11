// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreateFirstUser from './CreateFirstUser.jsx'

describe('CreateFirstUser', () => {
  beforeEach(() => {
    window.api = {
      auth: {
        createFirstUser: vi.fn()
      }
    }
  })

  async function fillForm(user, { username, password, confirmPassword }) {
    await user.type(screen.getByLabelText(/^username$/i), username)
    await user.type(screen.getByLabelText(/^password$/i), password)
    await user.type(screen.getByLabelText(/confirm password/i), confirmPassword)
    await user.click(screen.getByRole('button', { name: /create account/i }))
  }

  it('rejects mismatched passwords without calling the API', async () => {
    const user = userEvent.setup()
    const onCreated = vi.fn()

    render(<CreateFirstUser onCreated={onCreated} />)
    await fillForm(user, {
      username: 'alice',
      password: 'correct-horse-battery',
      confirmPassword: 'does-not-match'
    })

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
    expect(window.api.auth.createFirstUser).not.toHaveBeenCalled()
    expect(onCreated).not.toHaveBeenCalled()
  })

  it('rejects a password shorter than 8 characters without calling the API', async () => {
    const user = userEvent.setup()
    const onCreated = vi.fn()

    render(<CreateFirstUser onCreated={onCreated} />)
    await fillForm(user, { username: 'alice', password: 'short', confirmPassword: 'short' })

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument()
    expect(window.api.auth.createFirstUser).not.toHaveBeenCalled()
    expect(onCreated).not.toHaveBeenCalled()
  })

  it('creates the account and calls onCreated when the API succeeds', async () => {
    const user = userEvent.setup()
    const onCreated = vi.fn()
    window.api.auth.createFirstUser.mockResolvedValue({
      success: true,
      user: { id: 1, username: 'alice' }
    })

    render(<CreateFirstUser onCreated={onCreated} />)
    await fillForm(user, {
      username: 'alice',
      password: 'correct-horse-battery',
      confirmPassword: 'correct-horse-battery'
    })

    expect(window.api.auth.createFirstUser).toHaveBeenCalledWith({
      username: 'alice',
      password: 'correct-horse-battery'
    })
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith({ id: 1, username: 'alice' }))
  })

  it('shows the API error and does not call onCreated when creation fails', async () => {
    const user = userEvent.setup()
    const onCreated = vi.fn()
    window.api.auth.createFirstUser.mockResolvedValue({
      success: false,
      error: 'A user already exists.'
    })

    render(<CreateFirstUser onCreated={onCreated} />)
    await fillForm(user, {
      username: 'alice',
      password: 'correct-horse-battery',
      confirmPassword: 'correct-horse-battery'
    })

    expect(await screen.findByText('A user already exists.')).toBeInTheDocument()
    expect(onCreated).not.toHaveBeenCalled()
  })
})

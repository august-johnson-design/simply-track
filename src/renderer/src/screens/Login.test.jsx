// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from './Login.jsx'

describe('Login', () => {
  beforeEach(() => {
    window.api = {
      auth: {
        login: vi.fn()
      }
    }
  })

  it('calls onLogin with the returned user on a successful login', async () => {
    const user = userEvent.setup()
    window.api.auth.login.mockResolvedValue({
      success: true,
      user: { id: 1, username: 'alice' }
    })
    const onLogin = vi.fn()

    render(<Login onLogin={onLogin} />)

    await user.type(screen.getByLabelText(/username/i), 'alice')
    await user.type(screen.getByLabelText(/password/i), 'correct-horse-battery')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(window.api.auth.login).toHaveBeenCalledWith({
      username: 'alice',
      password: 'correct-horse-battery'
    })
    await waitFor(() => expect(onLogin).toHaveBeenCalledWith({ id: 1, username: 'alice' }))
  })

  it('shows an error and does not call onLogin when login fails', async () => {
    const user = userEvent.setup()
    window.api.auth.login.mockResolvedValue({
      success: false,
      error: 'Invalid username or password.'
    })
    const onLogin = vi.fn()

    render(<Login onLogin={onLogin} />)

    await user.type(screen.getByLabelText(/username/i), 'alice')
    await user.type(screen.getByLabelText(/password/i), 'wrong-password')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Invalid username or password.')).toBeInTheDocument()
    expect(onLogin).not.toHaveBeenCalled()
  })
})

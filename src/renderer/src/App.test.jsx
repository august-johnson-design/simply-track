// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App.jsx'

describe('App', () => {
  beforeEach(() => {
    window.api = {
      auth: {
        hasAnyUser: vi.fn(),
        createFirstUser: vi.fn(),
        login: vi.fn()
      },
      templates: {
        list: vi.fn().mockResolvedValue([
          {
            id: 1,
            name: 'Default Intake',
            is_default: 1,
            field_schema: [{ key: 'name', label: 'Name', type: 'text', required: true }]
          }
        ])
      },
      entries: {
        list: vi.fn().mockResolvedValue([]),
        search: vi.fn().mockResolvedValue([])
      }
    }
  })

  it('shows the first-run setup screen when no account exists yet', async () => {
    window.api.auth.hasAnyUser.mockResolvedValue(false)

    render(<App />)

    expect(await screen.findByText(/set up your login to get started/i)).toBeInTheDocument()
  })

  it('shows the login screen when an account already exists', async () => {
    window.api.auth.hasAnyUser.mockResolvedValue(true)

    render(<App />)

    expect(await screen.findByText(/sign in to continue/i)).toBeInTheDocument()
  })

  it('moves from login to the dashboard after a successful sign-in', async () => {
    const user = userEvent.setup()
    window.api.auth.hasAnyUser.mockResolvedValue(true)
    window.api.auth.login.mockResolvedValue({
      success: true,
      user: { id: 1, username: 'alice' }
    })

    render(<App />)

    await user.type(await screen.findByLabelText(/username/i), 'alice')
    await user.type(screen.getByLabelText(/password/i), 'correct-horse-battery')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('alice')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument()
  })
})

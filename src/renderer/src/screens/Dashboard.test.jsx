// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Dashboard from './Dashboard.jsx'

describe('Dashboard', () => {
  beforeEach(() => {
    window.api = {
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
        create: vi.fn(),
        list: vi.fn().mockResolvedValue([]),
        search: vi.fn().mockResolvedValue([])
      }
    }
  })

  it('shows the logged-in username and defaults to the Search section', async () => {
    render(<Dashboard user={{ id: 1, username: 'alice' }} onLogout={vi.fn()} />)

    expect(screen.getByText('alice')).toBeInTheDocument()
    expect(await screen.findByLabelText(/search entries/i)).toBeInTheDocument()
  })

  it('switches sections when a nav tab is clicked', async () => {
    const user = userEvent.setup()
    render(<Dashboard user={{ id: 1, username: 'alice' }} onLogout={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'New Entry' }))
    expect(await screen.findByLabelText(/^name/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Forms' }))
    expect(await screen.findByRole('button', { name: /new template/i })).toBeInTheDocument()
    expect(screen.getByText('Default Intake')).toBeInTheDocument()
  })

  it('calls onLogout when the log out button is clicked', async () => {
    const user = userEvent.setup()
    const onLogout = vi.fn()
    render(<Dashboard user={{ id: 1, username: 'alice' }} onLogout={onLogout} />)

    await user.click(screen.getByRole('button', { name: /log out/i }))

    expect(onLogout).toHaveBeenCalledTimes(1)
  })
})

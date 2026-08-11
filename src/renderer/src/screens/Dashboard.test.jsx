// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Dashboard from './Dashboard.jsx'

describe('Dashboard', () => {
  it('shows the logged-in username and defaults to the Search section', () => {
    render(<Dashboard user={{ id: 1, username: 'alice' }} onLogout={vi.fn()} />)

    expect(screen.getByText('alice')).toBeInTheDocument()
    expect(screen.getByText(/search across every stored field/i)).toBeInTheDocument()
  })

  it('switches sections when a nav tab is clicked', async () => {
    const user = userEvent.setup()
    render(<Dashboard user={{ id: 1, username: 'alice' }} onLogout={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'New Entry' }))
    expect(screen.getByText(/intake form for creating a new entry/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Forms' }))
    expect(screen.getByText(/build custom fields/i)).toBeInTheDocument()
  })

  it('calls onLogout when the log out button is clicked', async () => {
    const user = userEvent.setup()
    const onLogout = vi.fn()
    render(<Dashboard user={{ id: 1, username: 'alice' }} onLogout={onLogout} />)

    await user.click(screen.getByRole('button', { name: /log out/i }))

    expect(onLogout).toHaveBeenCalledTimes(1)
  })
})

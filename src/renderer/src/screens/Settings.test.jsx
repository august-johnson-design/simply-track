// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Settings from './Settings.jsx'

describe('Settings', () => {
  beforeEach(() => {
    window.api = {
      backup: {
        export: vi.fn()
      }
    }
  })

  it('exports a backup and shows the destination path on success', async () => {
    const user = userEvent.setup()
    window.api.backup.export.mockResolvedValue({
      success: true,
      path: '/Users/tester/Desktop/simply-track-backup-2026-08-11.sqlite'
    })

    render(<Settings />)
    await user.click(screen.getByRole('button', { name: /export backup/i }))

    expect(
      await screen.findByText(/Backup saved to \/Users\/tester\/Desktop\/simply-track-backup-2026-08-11\.sqlite/)
    ).toBeInTheDocument()
  })

  it('shows an error message when the export fails', async () => {
    const user = userEvent.setup()
    window.api.backup.export.mockResolvedValue({
      success: false,
      error: 'Disk is full.'
    })

    render(<Settings />)
    await user.click(screen.getByRole('button', { name: /export backup/i }))

    expect(await screen.findByText('Disk is full.')).toBeInTheDocument()
  })

  it('shows nothing when the user cancels the save dialog', async () => {
    const user = userEvent.setup()
    window.api.backup.export.mockResolvedValue({ success: false, canceled: true })

    render(<Settings />)
    await user.click(screen.getByRole('button', { name: /export backup/i }))

    await vi.waitFor(() => expect(window.api.backup.export).toHaveBeenCalled())
    expect(screen.queryByText(/could not export/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export backup/i })).not.toBeDisabled()
  })
})

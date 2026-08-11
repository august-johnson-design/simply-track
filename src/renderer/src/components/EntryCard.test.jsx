// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EntryCard from './EntryCard.jsx'

const FIELD_SCHEMA = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'notes', label: 'Notes', type: 'textarea', required: false }
]

const ENTRY = {
  id: 42,
  template_id: 1,
  data: { name: 'Alice Anderson', notes: '' }
}

describe('EntryCard', () => {
  beforeEach(() => {
    window.api = {
      entries: {
        update: vi.fn(),
        delete: vi.fn()
      }
    }
    window.confirm = vi.fn().mockReturnValue(true)
  })

  it('shows every field value for the entry', () => {
    render(<EntryCard entry={ENTRY} fieldSchema={FIELD_SCHEMA} onUpdated={vi.fn()} onDeleted={vi.fn()} />)

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Alice Anderson')).toBeInTheDocument()
    expect(screen.getByText('Notes')).toBeInTheDocument()
  })

  it('switches to an editable form when Edit is clicked, pre-filled with current values', async () => {
    const user = userEvent.setup()
    render(<EntryCard entry={ENTRY} fieldSchema={FIELD_SCHEMA} onUpdated={vi.fn()} onDeleted={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /edit/i }))

    expect(screen.getByLabelText(/^name/i)).toHaveValue('Alice Anderson')
  })

  it('saves changes and returns to view mode', async () => {
    const user = userEvent.setup()
    const onUpdated = vi.fn()
    window.api.entries.update.mockResolvedValue({
      success: true,
      entry: { ...ENTRY, data: { name: 'Alice Updated', notes: '' } }
    })

    render(<EntryCard entry={ENTRY} fieldSchema={FIELD_SCHEMA} onUpdated={onUpdated} onDeleted={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /edit/i }))
    const nameInput = screen.getByLabelText(/^name/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Alice Updated')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() =>
      expect(window.api.entries.update).toHaveBeenCalledWith({
        id: 42,
        templateId: 1,
        data: { name: 'Alice Updated', notes: '' }
      })
    )
    await waitFor(() =>
      expect(onUpdated).toHaveBeenCalledWith({ ...ENTRY, data: { name: 'Alice Updated', notes: '' } })
    )
    expect(screen.queryByLabelText(/^name/i)).not.toBeInTheDocument()
  })

  it('cancel discards changes without saving', async () => {
    const user = userEvent.setup()
    render(<EntryCard entry={ENTRY} fieldSchema={FIELD_SCHEMA} onUpdated={vi.fn()} onDeleted={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /edit/i }))
    await user.type(screen.getByLabelText(/^name/i), ' extra text')
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(window.api.entries.update).not.toHaveBeenCalled()
    expect(screen.getByText('Alice Anderson')).toBeInTheDocument()
  })

  it('asks for confirmation and deletes when confirmed', async () => {
    const user = userEvent.setup()
    const onDeleted = vi.fn()
    window.api.entries.delete.mockResolvedValue({ success: true })

    render(<EntryCard entry={ENTRY} fieldSchema={FIELD_SCHEMA} onUpdated={vi.fn()} onDeleted={onDeleted} />)

    await user.click(screen.getByRole('button', { name: /delete/i }))

    expect(window.confirm).toHaveBeenCalled()
    await waitFor(() => expect(window.api.entries.delete).toHaveBeenCalledWith(42))
    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith(42))
  })

  it('does not delete when confirmation is declined', async () => {
    const user = userEvent.setup()
    window.confirm.mockReturnValue(false)

    render(<EntryCard entry={ENTRY} fieldSchema={FIELD_SCHEMA} onUpdated={vi.fn()} onDeleted={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /delete/i }))

    expect(window.api.entries.delete).not.toHaveBeenCalled()
  })
})

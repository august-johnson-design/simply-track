// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchPanel from './SearchPanel.jsx'

const TEMPLATE = {
  id: 1,
  field_schema: [{ key: 'name', label: 'Name', type: 'text', required: true }]
}

const RECENT_ENTRY = { id: 1, template_id: 1, data: { name: 'Alice Anderson' } }
const SEARCH_RESULT = { id: 2, template_id: 1, data: { name: 'Bob Baker' } }

describe('SearchPanel', () => {
  beforeEach(() => {
    window.api = {
      templates: { getDefault: vi.fn().mockResolvedValue(TEMPLATE) },
      entries: {
        list: vi.fn().mockResolvedValue([RECENT_ENTRY]),
        search: vi.fn().mockResolvedValue([SEARCH_RESULT]),
        update: vi.fn(),
        delete: vi.fn()
      }
    }
  })

  it('loads recent entries on mount when the search box is empty', async () => {
    render(<SearchPanel />)

    expect(await screen.findByText('Alice Anderson')).toBeInTheDocument()
    expect(window.api.entries.list).toHaveBeenCalled()
    expect(window.api.entries.search).not.toHaveBeenCalled()
  })

  it('searches (debounced) as the user types and shows results', async () => {
    const user = userEvent.setup()
    render(<SearchPanel />)
    await screen.findByText('Alice Anderson')

    await user.type(screen.getByLabelText(/search entries/i), 'bob')

    await waitFor(() => expect(window.api.entries.search).toHaveBeenCalledWith('bob'), {
      timeout: 1000
    })
    expect(await screen.findByText('Bob Baker')).toBeInTheDocument()
    expect(screen.queryByText('Alice Anderson')).not.toBeInTheDocument()
  })

  it('falls back to the recent list when the search box is cleared', async () => {
    const user = userEvent.setup()
    render(<SearchPanel />)
    await screen.findByText('Alice Anderson')

    const input = screen.getByLabelText(/search entries/i)
    await user.type(input, 'bob')
    await screen.findByText('Bob Baker')

    await user.clear(input)

    await waitFor(() => expect(window.api.entries.list).toHaveBeenCalledTimes(2), { timeout: 1000 })
    expect(await screen.findByText('Alice Anderson')).toBeInTheDocument()
  })

  it('shows a no-results message when a search comes back empty', async () => {
    const user = userEvent.setup()
    window.api.entries.search.mockResolvedValue([])
    render(<SearchPanel />)
    await screen.findByText('Alice Anderson')

    await user.type(screen.getByLabelText(/search entries/i), 'nobody')

    expect(await screen.findByText(/no matching entries/i)).toBeInTheDocument()
  })

  it('removes an entry from the results when it is deleted', async () => {
    const user = userEvent.setup()
    window.api.entries.delete.mockResolvedValue({ success: true })
    window.confirm = vi.fn().mockReturnValue(true)

    render(<SearchPanel />)
    await screen.findByText('Alice Anderson')

    await user.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => expect(screen.queryByText('Alice Anderson')).not.toBeInTheDocument())
  })
})

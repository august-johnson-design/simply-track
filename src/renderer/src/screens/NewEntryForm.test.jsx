// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewEntryForm from './NewEntryForm.jsx'

const TEMPLATE = {
  id: 1,
  name: 'Default Intake',
  is_default: 1,
  field_schema: [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'phone', label: 'Phone', type: 'text', required: false },
    { key: 'notes', label: 'Notes', type: 'textarea', required: false }
  ]
}

describe('NewEntryForm', () => {
  beforeEach(() => {
    window.api = {
      templates: {
        list: vi.fn().mockResolvedValue([TEMPLATE])
      },
      entries: {
        create: vi.fn()
      }
    }
  })

  it('renders one input per template field, marking required fields', async () => {
    render(<NewEntryForm user={{ id: 1, username: 'alice' }} />)

    expect(await screen.findByLabelText(/^name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^phone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^notes/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^name/i)).toBeRequired()
    expect(screen.getByLabelText(/^phone/i)).not.toBeRequired()
  })

  it('submits the entered values with the template id and current user', async () => {
    const user = userEvent.setup()
    window.api.entries.create.mockResolvedValue({
      success: true,
      entry: { id: 1, template_id: 1, data: { name: 'Alice', phone: '', notes: '' } }
    })

    render(<NewEntryForm user={{ id: 7, username: 'alice' }} />)

    await user.type(await screen.findByLabelText(/^name/i), 'Alice')
    await user.click(screen.getByRole('button', { name: /save entry/i }))

    await waitFor(() =>
      expect(window.api.entries.create).toHaveBeenCalledWith({
        templateId: 1,
        data: { name: 'Alice', phone: '', notes: '' },
        createdBy: 7
      })
    )
    expect(await screen.findByText(/entry saved/i)).toBeInTheDocument()
  })

  it('clears the form after a successful save', async () => {
    const user = userEvent.setup()
    window.api.entries.create.mockResolvedValue({
      success: true,
      entry: { id: 1, template_id: 1, data: { name: 'Alice', phone: '', notes: '' } }
    })

    render(<NewEntryForm user={{ id: 7, username: 'alice' }} />)

    const nameInput = await screen.findByLabelText(/^name/i)
    await user.type(nameInput, 'Alice')
    await user.click(screen.getByRole('button', { name: /save entry/i }))

    await waitFor(() => expect(nameInput).toHaveValue(''))
  })

  it('shows an error and keeps entered values when the API call fails', async () => {
    const user = userEvent.setup()
    window.api.entries.create.mockResolvedValue({
      success: false,
      error: 'Name is required.'
    })

    render(<NewEntryForm user={{ id: 7, username: 'alice' }} />)

    const nameInput = await screen.findByLabelText(/^name/i)
    await user.type(nameInput, 'Alice')
    await user.click(screen.getByRole('button', { name: /save entry/i }))

    expect(await screen.findByText('Name is required.')).toBeInTheDocument()
    expect(nameInput).toHaveValue('Alice')
  })

  it('does not show a template picker when only one template exists', async () => {
    render(<NewEntryForm user={{ id: 1, username: 'alice' }} />)

    await screen.findByLabelText(/^name/i)
    expect(screen.queryByLabelText(/^form$/i)).not.toBeInTheDocument()
  })

  it('shows a template picker and switches fields when multiple templates exist', async () => {
    const user = userEvent.setup()
    const otherTemplate = {
      id: 2,
      name: 'Vendor Intake',
      is_default: 0,
      field_schema: [{ key: 'company', label: 'Company', type: 'text', required: true }]
    }
    window.api.templates.list.mockResolvedValue([TEMPLATE, otherTemplate])

    render(<NewEntryForm user={{ id: 1, username: 'alice' }} />)

    expect(await screen.findByLabelText(/^name/i)).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText(/^form$/i), '2')

    expect(screen.queryByLabelText(/^name/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/^company/i)).toBeInTheDocument()
  })
})

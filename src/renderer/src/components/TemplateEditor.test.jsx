// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TemplateEditor from './TemplateEditor.jsx'

describe('TemplateEditor', () => {
  it('starts blank with no fields when creating a new template', () => {
    render(<TemplateEditor initialTemplate={null} onSave={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.getByLabelText(/template name/i)).toHaveValue('')
    expect(screen.queryByRole('button', { name: /^remove/i })).not.toBeInTheDocument()
  })

  it('pre-fills name and fields when editing an existing template', () => {
    const template = {
      id: 1,
      name: 'Vendor Intake',
      field_schema: [{ key: 'company', label: 'Company', type: 'text', required: true }]
    }

    render(<TemplateEditor initialTemplate={template} onSave={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.getByLabelText(/template name/i)).toHaveValue('Vendor Intake')
    expect(screen.getByLabelText(/field 1 label/i)).toHaveValue('Company')
  })

  it('adds a new field row', async () => {
    const user = userEvent.setup()
    render(<TemplateEditor initialTemplate={null} onSave={vi.fn()} onCancel={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /add field/i }))

    expect(screen.getByLabelText(/field 1 label/i)).toHaveValue('New Field')
  })

  it('removes a field row', async () => {
    const user = userEvent.setup()
    const template = {
      id: 1,
      name: 'Vendor Intake',
      field_schema: [
        { key: 'company', label: 'Company', type: 'text', required: true },
        { key: 'notes', label: 'Notes', type: 'textarea', required: false }
      ]
    }

    render(<TemplateEditor initialTemplate={template} onSave={vi.fn()} onCancel={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /remove company/i }))

    expect(screen.queryByLabelText(/field.*label/i)).toHaveValue('Notes')
  })

  it('reorders fields with the move up/down buttons', async () => {
    const user = userEvent.setup()
    const template = {
      id: 1,
      name: 'Vendor Intake',
      field_schema: [
        { key: 'company', label: 'Company', type: 'text', required: true },
        { key: 'notes', label: 'Notes', type: 'textarea', required: false }
      ]
    }

    render(<TemplateEditor initialTemplate={template} onSave={vi.fn()} onCancel={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /move notes up/i }))

    expect(screen.getByLabelText(/field 1 label/i)).toHaveValue('Notes')
    expect(screen.getByLabelText(/field 2 label/i)).toHaveValue('Company')
  })

  it('calls onSave with the current name and fields', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue({ success: true })

    render(<TemplateEditor initialTemplate={null} onSave={onSave} onCancel={vi.fn()} />)

    await user.type(screen.getByLabelText(/template name/i), 'Vendor Intake')
    await user.click(screen.getByRole('button', { name: /add field/i }))

    const labelInput = screen.getByLabelText(/field 1 label/i)
    await user.clear(labelInput)
    await user.type(labelInput, 'Company')
    await user.click(screen.getByRole('button', { name: /^save template/i }))

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        name: 'Vendor Intake',
        fieldSchema: [{ key: 'new_field', label: 'Company', type: 'text', required: false }]
      })
    )
  })

  it('shows an error returned by onSave without discarding entered data', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue({ success: false, error: 'Template name is required.' })

    render(<TemplateEditor initialTemplate={null} onSave={onSave} onCancel={vi.fn()} />)
    await user.type(screen.getByLabelText(/template name/i), 'x')
    await user.click(screen.getByRole('button', { name: /^save template/i }))

    expect(await screen.findByText('Template name is required.')).toBeInTheDocument()
    expect(screen.getByLabelText(/template name/i)).toHaveValue('x')
  })

  it('calls onCancel when Cancel is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()

    render(<TemplateEditor initialTemplate={null} onSave={vi.fn()} onCancel={onCancel} />)
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

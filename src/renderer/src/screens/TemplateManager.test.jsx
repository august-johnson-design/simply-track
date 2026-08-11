// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TemplateManager from './TemplateManager.jsx'

const DEFAULT_TEMPLATE = {
  id: 1,
  name: 'Default Intake',
  is_default: 1,
  field_schema: [{ key: 'name', label: 'Name', type: 'text', required: true }]
}

const OTHER_TEMPLATE = {
  id: 2,
  name: 'Vendor Intake',
  is_default: 0,
  field_schema: [{ key: 'company', label: 'Company', type: 'text', required: true }]
}

describe('TemplateManager', () => {
  beforeEach(() => {
    window.api = {
      templates: {
        list: vi.fn().mockResolvedValue([DEFAULT_TEMPLATE, OTHER_TEMPLATE]),
        create: vi.fn(),
        update: vi.fn(),
        setDefault: vi.fn(),
        delete: vi.fn()
      }
    }
    window.confirm = vi.fn().mockReturnValue(true)
  })

  it('lists templates with a Default badge on the default one', async () => {
    render(<TemplateManager />)

    expect(await screen.findByText('Default Intake')).toBeInTheDocument()
    expect(screen.getByText('Vendor Intake')).toBeInTheDocument()
    expect(screen.getByText('Default')).toBeInTheDocument()
  })

  it('does not offer Set default / Delete on the default template', async () => {
    render(<TemplateManager />)
    await screen.findByText('Default Intake')

    const rows = screen.getAllByRole('listitem')
    const defaultRow = rows.find((row) => row.textContent.includes('Default Intake'))
    expect(defaultRow.querySelector('button[type="button"]')).toBeTruthy()
    expect(
      Array.from(defaultRow.querySelectorAll('button')).some((b) => /set default/i.test(b.textContent))
    ).toBe(false)
  })

  it('opens the editor when New template is clicked', async () => {
    const user = userEvent.setup()
    render(<TemplateManager />)
    await screen.findByText('Default Intake')

    await user.click(screen.getByRole('button', { name: /new template/i }))

    expect(screen.getByLabelText(/template name/i)).toBeInTheDocument()
  })

  it('opens the editor pre-filled when Edit is clicked on an existing template', async () => {
    const user = userEvent.setup()
    render(<TemplateManager />)
    await screen.findByText('Default Intake')

    const rows = screen.getAllByRole('listitem')
    const vendorRow = rows.find((row) => row.textContent.includes('Vendor Intake'))
    await user.click(
      Array.from(vendorRow.querySelectorAll('button')).find((b) => /edit/i.test(b.textContent))
    )

    expect(screen.getByLabelText(/template name/i)).toHaveValue('Vendor Intake')
  })

  it('sets a template as default', async () => {
    const user = userEvent.setup()
    window.api.templates.setDefault.mockResolvedValue({ success: true, template: OTHER_TEMPLATE })

    render(<TemplateManager />)
    await screen.findByText('Vendor Intake')

    const rows = screen.getAllByRole('listitem')
    const vendorRow = rows.find((row) => row.textContent.includes('Vendor Intake'))
    await user.click(
      Array.from(vendorRow.querySelectorAll('button')).find((b) => /set default/i.test(b.textContent))
    )

    await waitFor(() => expect(window.api.templates.setDefault).toHaveBeenCalledWith(2))
  })

  it('deletes a template after confirmation', async () => {
    const user = userEvent.setup()
    window.api.templates.delete.mockResolvedValue({ success: true })

    render(<TemplateManager />)
    await screen.findByText('Vendor Intake')

    const rows = screen.getAllByRole('listitem')
    const vendorRow = rows.find((row) => row.textContent.includes('Vendor Intake'))
    await user.click(
      Array.from(vendorRow.querySelectorAll('button')).find((b) => /delete/i.test(b.textContent))
    )

    expect(window.confirm).toHaveBeenCalled()
    await waitFor(() => expect(window.api.templates.delete).toHaveBeenCalledWith(2))
  })

  it('shows an error when deletion is refused', async () => {
    const user = userEvent.setup()
    window.api.templates.delete.mockResolvedValue({
      success: false,
      error: 'Cannot delete a template that still has entries using it.'
    })

    render(<TemplateManager />)
    await screen.findByText('Vendor Intake')

    const rows = screen.getAllByRole('listitem')
    const vendorRow = rows.find((row) => row.textContent.includes('Vendor Intake'))
    await user.click(
      Array.from(vendorRow.querySelectorAll('button')).find((b) => /delete/i.test(b.textContent))
    )

    expect(
      await screen.findByText('Cannot delete a template that still has entries using it.')
    ).toBeInTheDocument()
  })
})

/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UploadMaterialModal } from '@/components/features/materials/UploadMaterialModal'
import { toast } from 'sonner'

jest.mock('sonner', () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}))

// lucide-react icons throw in jsdom without this
jest.mock('lucide-react', () => ({
  Upload: () => <svg data-testid="icon-upload" />,
  FileText: () => <svg data-testid="icon-file" />,
  X: () => <svg data-testid="icon-x" />,
  Loader2: () => <svg data-testid="icon-loader" />,
}))

global.fetch = jest.fn()

const defaultProps = {
  open: true,
  onOpenChange: jest.fn(),
  onSuccess: jest.fn(),
}

function makePdf(name = 'notes.pdf', sizeBytes = 1024): File {
  const file = new File(['content'], name, { type: 'application/pdf' })
  Object.defineProperty(file, 'size', { value: sizeBytes, configurable: true })
  return file
}

function getFileInput(): HTMLInputElement {
  return document.querySelector('input[type="file"]') as HTMLInputElement
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('UploadMaterialModal', () => {
  it('renders dialog content when open', () => {
    render(<UploadMaterialModal {...defaultProps} />)
    expect(screen.getByText('Upload Study Material')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/calculus chapter/i)).toBeInTheDocument()
  })

  it('does not render dialog content when closed', () => {
    render(<UploadMaterialModal {...defaultProps} open={false} />)
    expect(screen.queryByText('Upload Study Material')).not.toBeInTheDocument()
  })

  it('rejects non-PDF files and shows error toast', async () => {
    render(<UploadMaterialModal {...defaultProps} />)

    const input = getFileInput()
    const txtFile = new File(['hello'], 'readme.txt', { type: 'text/plain' })
    fireEvent.change(input, { target: { files: [txtFile] } })

    expect(toast.error).toHaveBeenCalledWith(
      'File type not supported',
      expect.objectContaining({ description: 'Only PDF files are accepted.' })
    )
    expect(screen.queryByText('readme.txt')).not.toBeInTheDocument()
  })

  it('rejects files over 50 MB and shows error toast', async () => {
    const user = userEvent.setup()
    render(<UploadMaterialModal {...defaultProps} />)

    const input = getFileInput()
    const bigFile = makePdf('large.pdf', 51 * 1024 * 1024)
    await user.upload(input, bigFile, { applyAccept: false })

    expect(toast.error).toHaveBeenCalledWith(
      'File too large',
      expect.objectContaining({ description: 'Maximum file size is 50 MB.' })
    )
    expect(screen.queryByText('large.pdf')).not.toBeInTheDocument()
  })

  it('accepts a valid PDF and shows its name and size', async () => {
    const user = userEvent.setup()
    render(<UploadMaterialModal {...defaultProps} />)

    const input = getFileInput()
    const pdf = makePdf('lecture.pdf', 2 * 1024 * 1024)
    await user.upload(input, pdf)

    expect(screen.getByText('lecture.pdf')).toBeInTheDocument()
    expect(screen.getByText('2.0 MB')).toBeInTheDocument()
  })

  it('auto-fills title from filename when title is empty', async () => {
    const user = userEvent.setup()
    render(<UploadMaterialModal {...defaultProps} />)

    const input = getFileInput()
    await user.upload(input, makePdf('calculus-notes.pdf'))

    expect(screen.getByPlaceholderText(/calculus chapter/i)).toHaveValue('calculus-notes')
  })

  it('does not overwrite an existing title when file is selected', async () => {
    const user = userEvent.setup()
    render(<UploadMaterialModal {...defaultProps} />)

    await user.type(screen.getByPlaceholderText(/calculus chapter/i), 'My Custom Title')

    const input = getFileInput()
    await user.upload(input, makePdf('lecture.pdf'))

    expect(screen.getByPlaceholderText(/calculus chapter/i)).toHaveValue('My Custom Title')
  })

  it('clears the selected file when X button is clicked', async () => {
    const user = userEvent.setup()
    render(<UploadMaterialModal {...defaultProps} />)

    const input = getFileInput()
    await user.upload(input, makePdf('notes.pdf'))
    expect(screen.getByText('notes.pdf')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /remove file/i }))
    expect(screen.queryByText('notes.pdf')).not.toBeInTheDocument()
    expect(screen.getByText('Click to choose a file')).toBeInTheDocument()
  })

  it('submit button is disabled when no file is selected', () => {
    render(<UploadMaterialModal {...defaultProps} />)
    expect(screen.getByRole('button', { name: /^upload$/i })).toBeDisabled()
  })

  it('POSTs to /api/materials with file and title on submit', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ material: { id: 'mat-1' } }),
    })
    const user = userEvent.setup()
    render(<UploadMaterialModal {...defaultProps} />)

    const input = getFileInput()
    await user.upload(input, makePdf('notes.pdf'))
    await user.click(screen.getByRole('button', { name: /^upload$/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/materials',
        expect.objectContaining({ method: 'POST' })
      )
    })

    const formData = (global.fetch as jest.Mock).mock.calls[0][1].body as FormData
    expect(formData.get('title')).toBe('notes')
    expect((formData.get('file') as File).name).toBe('notes.pdf')
  })

  it('shows success toast and calls onSuccess after successful upload', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ material: { id: 'mat-1' } }),
    })
    const user = userEvent.setup()
    const onSuccess = jest.fn()
    render(<UploadMaterialModal {...defaultProps} onSuccess={onSuccess} />)

    const input = getFileInput()
    await user.upload(input, makePdf('notes.pdf'))
    await user.click(screen.getByRole('button', { name: /^upload$/i }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Material uploaded successfully!')
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('shows API error message from response on failure', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Duplicate material title' }),
    })
    const user = userEvent.setup()
    render(<UploadMaterialModal {...defaultProps} />)

    const input = getFileInput()
    await user.upload(input, makePdf('notes.pdf'))
    await user.click(screen.getByRole('button', { name: /^upload$/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Duplicate material title')
    })
  })

  it('shows generic error toast on network failure', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
    const user = userEvent.setup()
    render(<UploadMaterialModal {...defaultProps} />)

    const input = getFileInput()
    await user.upload(input, makePdf('notes.pdf'))
    await user.click(screen.getByRole('button', { name: /^upload$/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Upload failed. Please try again.')
    })
  })

  it('shows Uploading... text while upload is in progress', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))
    const user = userEvent.setup()
    render(<UploadMaterialModal {...defaultProps} />)

    const input = getFileInput()
    await user.upload(input, makePdf('notes.pdf'))
    await user.click(screen.getByRole('button', { name: /^upload$/i }))

    await waitFor(() => {
      expect(screen.getByText('Uploading...')).toBeInTheDocument()
    })
  })

  it('calls onOpenChange(false) when Cancel is clicked', async () => {
    const user = userEvent.setup()
    const onOpenChange = jest.fn()
    render(<UploadMaterialModal {...defaultProps} onOpenChange={onOpenChange} />)

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

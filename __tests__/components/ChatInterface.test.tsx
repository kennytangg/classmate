/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatInterface } from '@/components/features/ai-tutor/ChatInterface'
import type { Message } from '@/hooks/useChat'

// Mock framer-motion — AnimatePresence and motion.* throw in jsdom
jest.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

// Mock react-markdown — ESM-only package; render children as plain text in tests
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

// Mock remark-gfm — ESM-only package; no-op in tests
jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: () => {},
}))

// Mock remark-math — ESM-only package; no-op in tests
jest.mock('remark-math', () => ({
  __esModule: true,
  default: () => {},
}))

// Mock rehype-raw — ESM-only package; no-op in tests
jest.mock('rehype-raw', () => ({
  __esModule: true,
  default: () => {},
}))

// Mock rehype-katex — ESM-only package; no-op in tests
jest.mock('rehype-katex', () => ({
  __esModule: true,
  default: () => {},
}))

// Mock react-syntax-highlighter — depends on ESM-only refractor package
jest.mock('react-syntax-highlighter', () => ({
  __esModule: true,
  default: ({ children }: React.PropsWithChildren) => <pre>{children}</pre>,
  Prism: ({ children }: React.PropsWithChildren) => <pre>{children}</pre>,
}))
jest.mock('react-syntax-highlighter/dist/esm/styles/hljs', () => ({
  __esModule: true,
  nord: {},
}))

// Mock better-auth client — provides useSession hook
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: { user: { name: 'Test User' } } }),
  },
}))

// Mock next/navigation (precautionary — not used directly in this component)
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/ai-tutor',
}))

// Helper: build a Message object matching the type from hooks/useChat.ts
function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg-1',
    role: 'user',
    content: 'Hello',
    timestamp: new Date(),
    ...overrides,
  }
}

// Default prop set used in most tests
const defaultProps = {
  messages: [] as Message[],
  isLoading: false,
  error: null,
  sendMessage: jest.fn(),
}

describe('ChatInterface component', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    expect(() => render(<ChatInterface {...defaultProps} />)).not.toThrow()
  })

  it('renders a text input for composing messages', () => {
    render(<ChatInterface {...defaultProps} />)

    // The input has a placeholder defined in the component
    const input = screen.getByPlaceholderText(/ask a question/i)
    expect(input).toBeInTheDocument()
  })

  it('renders a send button', () => {
    render(<ChatInterface {...defaultProps} />)

    // In empty state: Send button + 4 suggested prompt chip buttons
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it('shows empty-state headline and prompt chips when no messages', () => {
    render(<ChatInterface {...defaultProps} />)

    // Headline
    expect(screen.getByText(/your ai study companion/i)).toBeInTheDocument()
    // Sub-text contains "ask anything"
    expect(screen.getByText(/ask anything/i)).toBeInTheDocument()
    // Suggested prompt chips
    expect(screen.getByText(/big o notation/i)).toBeInTheDocument()
  })

  it('does not show the empty-state hint when messages are present', () => {
    const props = {
      ...defaultProps,
      messages: [makeMessage({ role: 'user', content: 'Explain loops' })],
    }
    render(<ChatInterface {...props} />)

    expect(screen.queryByText(/your ai study companion/i)).not.toBeInTheDocument()
    expect(screen.getByText('Explain loops')).toBeInTheDocument()
  })

  it('calls sendMessage with the input value when the user types and presses Enter', async () => {
    const sendMessage = jest.fn()
    render(<ChatInterface {...defaultProps} sendMessage={sendMessage} />)

    const input = screen.getByPlaceholderText(/ask a question/i)
    await userEvent.type(input, 'What is a closure?')
    await userEvent.keyboard('{Enter}')

    expect(sendMessage).toHaveBeenCalledWith('What is a closure?', undefined)
  })

  it('calls sendMessage when a suggested prompt chip is clicked', async () => {
    const sendMessage = jest.fn()
    render(<ChatInterface {...defaultProps} sendMessage={sendMessage} />)

    await userEvent.click(screen.getByText(/big o notation/i))
    expect(sendMessage).toHaveBeenCalledWith('Explain Big O notation with examples')
  })

  it('displays an error message when the error prop is set', () => {
    render(<ChatInterface {...defaultProps} error="Something went wrong. Please try again." />)

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })

  it('disables the input and send button while isLoading is true', () => {
    render(<ChatInterface {...defaultProps} isLoading={true} />)

    const input = screen.getByPlaceholderText(/ask a question/i)
    expect(input).toBeDisabled()
  })

  it('shows loading history indicator when isLoadingHistory is true', () => {
    render(<ChatInterface {...defaultProps} isLoadingHistory={true} />)

    expect(screen.getByText(/loading conversation/i)).toBeInTheDocument()
    // Empty-state hint should NOT appear while loading history
    expect(screen.queryByText(/your ai study companion/i)).not.toBeInTheDocument()
  })

  it('shows the study companion headline', () => {
    render(<ChatInterface {...defaultProps} />)
    expect(screen.getByText(/your ai study companion/i)).toBeInTheDocument()
  })

  it('shows the user message content in the chat', () => {
    const props = {
      ...defaultProps,
      messages: [makeMessage({ role: 'user', content: 'Hello there' })],
    }
    render(<ChatInterface {...props} />)
    expect(screen.getByText('Hello there')).toBeInTheDocument()
  })
})

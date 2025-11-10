import { render, screen } from '@testing-library/react'
import { Navbar } from '../navbar'
import { useAuth } from '../providers/auth-provider'

// Mock the auth provider
jest.mock('../providers/auth-provider', () => ({
  useAuth: jest.fn(),
}))

describe('Navbar', () => {
  it('renders sign in and get started when not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null })

    render(<Navbar />)

    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByText('Get Started')).toBeInTheDocument()
    expect(screen.queryByText('Sign Out')).not.toBeInTheDocument()
  })

  it('renders user navigation when authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: '123', email: 'test@example.com' },
    })

    render(<Navbar />)

    expect(screen.getByText('Competitions')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('Sign Out')).toBeInTheDocument()
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
  })

  it('renders logo and title', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null })

    render(<Navbar />)

    expect(screen.getByText('PromptLympics')).toBeInTheDocument()
  })
})

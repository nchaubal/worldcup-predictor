import { render, screen } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'

// Mock the next/navigation module
jest.mock('next/navigation')

// Mock Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>
  }
})

describe('Navbar', () => {
  beforeEach(() => {
    ;(usePathname as jest.Mock).mockClear()
  })

  it('renders all navigation links', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/')
    
    render(<Navbar />)
    
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Predict')).toBeInTheDocument()
    expect(screen.getByText('Bracket')).toBeInTheDocument()
    expect(screen.getByText('Leagues')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
  })

  it('highlights the active page correctly', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/predict')
    
    render(<Navbar />)
    
    const predictLink = screen.getByText('Predict').closest('a')
    expect(predictLink).toHaveClass('text-primary')
    
    const homeLink = screen.getByText('Home').closest('a')
    expect(homeLink).not.toHaveClass('text-primary')
  })

  it('shows brand logo and title', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/')
    
    render(<Navbar />)
    
    expect(screen.getByText('WC Predictor')).toBeInTheDocument()
    expect(screen.getByText('FIFA 2026™')).toBeInTheDocument()
    expect(screen.getByText('🏆')).toBeInTheDocument()
  })

  it('handles nested routes correctly', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/predict/some-subroute')
    
    render(<Navbar />)
    
    const predictLink = screen.getByText('Predict').closest('a')
    expect(predictLink).toHaveClass('text-primary')
  })

  it('has correct link destinations', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/')
    
    render(<Navbar />)
    
    expect(screen.getByText('Home').closest('a')).toHaveAttribute('href', '/')
    expect(screen.getByText('Predict').closest('a')).toHaveAttribute('href', '/predict')
    expect(screen.getByText('Bracket').closest('a')).toHaveAttribute('href', '/bracket')
    expect(screen.getByText('Leagues').closest('a')).toHaveAttribute('href', '/leagues')
    expect(screen.getByText('Profile').closest('a')).toHaveAttribute('href', '/profile')
  })
})

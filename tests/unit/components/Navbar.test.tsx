import { render, screen, within } from '../../helpers/test-utils'
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

// The Navbar renders both a desktop nav and a mobile menu nav (CSS-toggled,
// both present in the DOM), so tests scope queries to the primary nav to
// avoid ambiguous "multiple elements" matches.
function primaryNav() {
  return within(screen.getByRole('navigation', { name: 'Primary' }))
}

describe('Navbar', () => {
  beforeEach(() => {
    ;(usePathname as jest.Mock).mockClear()
  })

  it('renders all navigation links', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/')

    render(<Navbar />)
    const nav = primaryNav()

    expect(nav.getByText('Home')).toBeInTheDocument()
    expect(nav.getByText('Predict')).toBeInTheDocument()
    expect(nav.getByText('Bracket')).toBeInTheDocument()
    expect(nav.getByText('Leagues')).toBeInTheDocument()
    expect(nav.getByText('Profile')).toBeInTheDocument()
  })

  it('highlights the active page correctly', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/predict')

    render(<Navbar />)
    const nav = primaryNav()

    const predictLink = nav.getByText('Predict').closest('a')
    expect(predictLink).toHaveClass('text-primary')

    const homeLink = nav.getByText('Home').closest('a')
    expect(homeLink).not.toHaveClass('text-primary')
  })

  it('shows brand logo and title', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/')

    render(<Navbar />)

    expect(screen.getByText('Boom FIFA World Cup 2026™ Predictor')).toBeInTheDocument()
    expect(screen.getByAltText('FIFA World Cup 2026')).toBeInTheDocument()
  })

  it('handles nested routes correctly', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/predict/some-subroute')

    render(<Navbar />)
    const nav = primaryNav()

    const predictLink = nav.getByText('Predict').closest('a')
    expect(predictLink).toHaveClass('text-primary')
  })

  it('has correct link destinations', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/')

    render(<Navbar />)
    const nav = primaryNav()

    expect(nav.getByText('Home').closest('a')).toHaveAttribute('href', '/')
    expect(nav.getByText('Predict').closest('a')).toHaveAttribute('href', '/predict')
    expect(nav.getByText('Bracket').closest('a')).toHaveAttribute('href', '/bracket')
    expect(nav.getByText('Leagues').closest('a')).toHaveAttribute('href', '/leagues')
    expect(nav.getByText('Profile').closest('a')).toHaveAttribute('href', '/profile')
  })
})

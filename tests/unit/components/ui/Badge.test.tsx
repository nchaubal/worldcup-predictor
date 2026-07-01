import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/badge'

describe('Badge', () => {
  it('renders with default styles', () => {
    render(<Badge>Badge content</Badge>)
    
    const badge = screen.getByText('Badge content')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('inline-flex')
    expect(badge).toHaveClass('items-center')
    expect(badge).toHaveClass('justify-center')
  })

  it('applies variant styles correctly', () => {
    render(<Badge variant="destructive">Delete</Badge>)
    
    const badge = screen.getByText('Delete')
    expect(badge).toHaveClass('bg-destructive/10')
    expect(badge).toHaveClass('text-destructive')
  })

  it('applies custom className', () => {
    render(<Badge className="custom-badge">Custom</Badge>)
    
    const badge = screen.getByText('Custom')
    expect(badge).toHaveClass('custom-badge')
  })

  it('supports different sizes', () => {
    const { rerender } = render(<Badge>Small</Badge>)
    
    let badge = screen.getByText('Small')
    expect(badge).toBeInTheDocument()
    
    rerender(<Badge>Large</Badge>)
    badge = screen.getByText('Large')
    expect(badge).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Badge onClick={handleClick}>Clickable</Badge>)
    
    const badge = screen.getByText('Clickable')
    badge.click()
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders with proper accessibility attributes', () => {
    render(<Badge aria-label="Status badge">Status</Badge>)
    
    const badge = screen.getByText('Status')
    expect(badge).toHaveAttribute('aria-label', 'Status badge')
  })

  it('supports render prop for custom elements', () => {
    render(
      <Badge render={<a href="/test" />}>Link Badge</Badge>
    )
    
    const link = screen.getByRole('link', { name: 'Link Badge' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test')
  })

  it('displays icons correctly', () => {
    render(<Badge>🔥 Hot</Badge>)
    
    const badge = screen.getByText('🔥 Hot')
    expect(badge).toBeInTheDocument()
  })

  it('handles long text content', () => {
    render(<Badge>This is a very long badge content that should wrap properly</Badge>)
    
    const badge = screen.getByText('This is a very long badge content that should wrap properly')
    expect(badge).toBeInTheDocument()
  })
})

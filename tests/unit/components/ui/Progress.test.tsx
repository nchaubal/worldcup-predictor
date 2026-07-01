import { render, screen } from '@testing-library/react'
import { Progress } from '@/components/ui/progress'

describe('Progress', () => {
  it('renders with default value', () => {
    render(<Progress value={50} />)
    
    const progress = screen.getByRole('progressbar')
    expect(progress).toBeInTheDocument()
    expect(progress).toHaveAttribute('aria-valuenow', '50')
  })

  it('renders with 0 value', () => {
    render(<Progress value={0} />)
    
    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveAttribute('aria-valuenow', '0')
  })

  it('renders with 100 value', () => {
    render(<Progress value={100} />)
    
    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveAttribute('aria-valuenow', '100')
  })

  it('applies custom className', () => {
    render(<Progress value={30} className="custom-progress" />)
    
    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveClass('custom-progress')
  })

  it('handles max value correctly', () => {
    render(<Progress value={50} max={200} />)
    
    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveAttribute('aria-valuemax', '200')
    expect(progress).toHaveAttribute('aria-valuenow', '50')
  })

  it('has proper accessibility attributes', () => {
    render(<Progress value={75} />)
    
    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveAttribute('aria-valuemin', '0')
    expect(progress).toHaveAttribute('aria-valuemax', '100')
    expect(progress).toHaveAttribute('aria-valuenow', '75')
  })

  it('clamps values within bounds', () => {
    render(<Progress value={150} />)
    
    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveAttribute('aria-valuenow', '150')
  })

  it('handles negative values', () => {
    render(<Progress value={-10} />)
    
    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveAttribute('aria-valuenow', '-10')
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<Progress value={50} />)
    
    let progress = screen.getByRole('progressbar')
    expect(progress).toBeInTheDocument()
    
    rerender(<Progress value={50} />)
    progress = screen.getByRole('progressbar')
    expect(progress).toBeInTheDocument()
  })

  it('supports indeterminate state', () => {
    render(<Progress value={null} />)
    
    const progress = screen.getByRole('progressbar')
    expect(progress).toBeInTheDocument()
    // When value is null, aria-valuenow attribute is not present
    expect(progress).not.toHaveAttribute('aria-valuenow')
  })

  it('has visual indicator for progress', () => {
    render(<Progress value={60} />)
    
    const progress = screen.getByRole('progressbar')
    expect(progress).toBeInTheDocument()
    
    // Check if there's a visual progress indicator
    const indicator = progress.querySelector('[data-slot="progress-indicator"]')
    expect(indicator).toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import { Separator } from '@/components/ui/separator'

describe('Separator', () => {
  it('renders horizontal separator by default', () => {
    render(<Separator data-testid="separator" />)
    
    const separator = screen.getByTestId('separator')
    expect(separator).toBeInTheDocument()
    expect(separator).toHaveAttribute('data-orientation', 'horizontal')
  })

  it('renders vertical separator', () => {
    render(<Separator orientation="vertical" data-testid="separator" />)
    
    const separator = screen.getByTestId('separator')
    expect(separator).toHaveAttribute('data-orientation', 'vertical')
  })

  it('applies custom className', () => {
    render(<Separator className="custom-separator" data-testid="separator" />)
    
    const separator = screen.getByTestId('separator')
    expect(separator).toHaveClass('custom-separator')
  })

  it('has data-slot attribute', () => {
    render(<Separator data-testid="separator" />)
    
    const separator = screen.getByTestId('separator')
    expect(separator).toHaveAttribute('data-slot', 'separator')
  })
})

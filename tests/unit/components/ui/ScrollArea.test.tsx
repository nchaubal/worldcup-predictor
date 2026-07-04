import { render, screen } from '@testing-library/react'
import { ScrollArea } from '@/components/ui/scroll-area'

describe('ScrollArea', () => {
  it('renders children content', () => {
    render(
      <ScrollArea>
        <div>Scrollable content</div>
      </ScrollArea>
    )
    
    expect(screen.getByText('Scrollable content')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <ScrollArea className="custom-scroll" data-testid="scroll-area">
        <div>Content</div>
      </ScrollArea>
    )
    
    const scrollArea = screen.getByTestId('scroll-area')
    expect(scrollArea).toHaveClass('custom-scroll')
  })

  it('has data-slot attribute', () => {
    render(
      <ScrollArea data-testid="scroll-area">
        <div>Content</div>
      </ScrollArea>
    )
    
    const scrollArea = screen.getByTestId('scroll-area')
    expect(scrollArea).toHaveAttribute('data-slot', 'scroll-area')
  })

  it('renders with relative positioning', () => {
    render(
      <ScrollArea data-testid="scroll-area">
        <div>Content</div>
      </ScrollArea>
    )
    
    const scrollArea = screen.getByTestId('scroll-area')
    expect(scrollArea).toHaveClass('relative')
  })
})

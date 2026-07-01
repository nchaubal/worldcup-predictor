import { render, screen } from '@testing-library/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

describe('Card Components', () => {
  describe('Card', () => {
    it('renders with default styles', () => {
      render(<Card>Card content</Card>)
      
      const card = screen.getByText('Card content')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('rounded-xl')
    })

    it('applies custom className', () => {
      render(<Card className="custom-card">Custom card</Card>)
      
      const card = screen.getByText('Custom card')
      expect(card).toHaveClass('custom-card')
    })
  })

  describe('CardHeader', () => {
    it('renders header content', () => {
      render(
        <Card>
          <CardHeader>Header content</CardHeader>
        </Card>
      )
      
      expect(screen.getByText('Header content')).toBeInTheDocument()
    })

    it('applies proper spacing', () => {
      render(
        <Card>
          <CardHeader>Header</CardHeader>
        </Card>
      )
      
      const header = screen.getByText('Header')
      expect(header).toHaveClass('grid')
    })
  })

  describe('CardTitle', () => {
    it('renders title with correct styles', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
        </Card>
      )
      
      const title = screen.getByText('Card Title')
      expect(title).toHaveClass('text-base')
      expect(title).toHaveClass('font-medium')
    })
  })

  describe('CardContent', () => {
    it('renders content with proper padding', () => {
      render(
        <Card>
          <CardContent>Content here</CardContent>
        </Card>
      )
      
      const content = screen.getByText('Content here')
      expect(content).toHaveClass('px-(--card-spacing)')
    })
  })

  describe('Complete Card Structure', () => {
    it('renders complete card with all components', () => {
      render(
        <Card className="test-card" data-testid="test-card">
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is the card content</p>
          </CardContent>
        </Card>
      )
      
      expect(screen.getByText('Test Card')).toBeInTheDocument()
      expect(screen.getByText('This is the card content')).toBeInTheDocument()
      expect(screen.getByTestId('test-card')).toHaveClass('test-card')
    })
  })
})

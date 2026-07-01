import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/input'

describe('Input', () => {
  it('renders with default props', () => {
    render(<Input placeholder="Enter text" />)
    
    const input = screen.getByPlaceholderText('Enter text')
    expect(input).toBeInTheDocument()
    expect(input).toHaveClass('h-8')
    expect(input).toHaveClass('w-full')
  })

  it('handles user input correctly', async () => {
    const user = userEvent.setup()
    render(<Input />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'Hello World')
    
    expect(input).toHaveValue('Hello World')
  })

  it('applies custom styles for different states', () => {
    render(<Input className="border-red-500" />)
    
    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
    expect(input).toHaveClass('border-red-500')
  })

  it('handles disabled state', () => {
    render(<Input disabled />)
    
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('handles focus and blur events', () => {
    const handleFocus = jest.fn()
    const handleBlur = jest.fn()
    
    render(<Input onFocus={handleFocus} onBlur={handleBlur} />)
    
    const input = screen.getByRole('textbox')
    input.focus()
    input.blur()
    
    expect(handleFocus).toHaveBeenCalledTimes(1)
    expect(handleBlur).toHaveBeenCalledTimes(1)
  })

  it('applies custom className', () => {
    render(<Input className="custom-input" />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('custom-input')
  })

  it('supports different input types', () => {
    render(<Input type="email" />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'email')
  })

  it('handles change events', () => {
    const handleChange = jest.fn()
    render(<Input onChange={handleChange} />)
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test' } })
    
    expect(handleChange).toHaveBeenCalledTimes(1)
  })

  it('supports required attribute', () => {
    render(<Input required />)
    
    const input = screen.getByRole('textbox')
    expect(input).toBeRequired()
  })

  it('supports placeholder text', () => {
    render(<Input placeholder="Search here..." />)
    
    const input = screen.getByPlaceholderText('Search here...')
    expect(input).toBeInTheDocument()
  })

  it('handles maxLength constraint', async () => {
    const user = userEvent.setup()
    render(<Input maxLength={5} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, '123456789')
    
    expect(input).toHaveValue('12345')
  })

  it('supports readonly state', () => {
    render(<Input readOnly value="readonly value" />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('readonly')
    expect(input).toHaveValue('readonly value')
  })
})

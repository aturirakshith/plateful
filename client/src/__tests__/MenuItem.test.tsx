import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import MenuItem from '../components/MenuItem'
import * as CartContext from '../context/CartContext'

const mockItem = {
  id: 'item-1',
  name: 'Cheese Burger',
  description: 'Juicy beef patty with cheese',
  price: 199,
  category: 'Burgers',
  available: true,
}

const addItem = vi.fn()

vi.spyOn(CartContext, 'useCart').mockReturnValue({
  cart: null,
  loading: false,
  addItem,
  updateItem: vi.fn(),
  removeItem: vi.fn(),
  refreshCart: vi.fn(),
  itemCount: 0,
})

describe('MenuItem', () => {
  it('renders item name, description, and price', () => {
    render(<MenuItem item={mockItem} />)
    expect(screen.getByText('Cheese Burger')).toBeInTheDocument()
    expect(screen.getByText('Juicy beef patty with cheese')).toBeInTheDocument()
    expect(screen.getByText('₹199')).toBeInTheDocument()
  })

  it('calls addItem when Add button is clicked', async () => {
    render(<MenuItem item={mockItem} />)
    fireEvent.click(screen.getByRole('button', { name: /add/i }))
    await waitFor(() => expect(addItem).toHaveBeenCalledWith('item-1'))
  })

  it('shows a placeholder when no imageUrl is provided', () => {
    render(<MenuItem item={{ ...mockItem, imageUrl: undefined }} />)
    expect(screen.getByText('🍽️')).toBeInTheDocument()
  })
})

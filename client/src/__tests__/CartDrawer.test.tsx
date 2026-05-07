import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import CartDrawer from '../components/CartDrawer'
import * as CartContext from '../context/CartContext'
import * as AuthContext from '../context/AuthContext'

const mockCart = {
  id: 'cart-1',
  items: [
    {
      id: 'ci-1',
      cartId: 'cart-1',
      menuItemId: 'item-1',
      quantity: 2,
      menuItem: { id: 'item-1', name: 'Cheese Burger', description: '', price: 199, category: 'Burgers', available: true },
    },
  ],
}

const updateItem = vi.fn()
const removeItem = vi.fn()

vi.spyOn(CartContext, 'useCart').mockReturnValue({
  cart: mockCart,
  loading: false,
  addItem: vi.fn(),
  updateItem,
  removeItem,
  refreshCart: vi.fn(),
  itemCount: 2,
})

vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
  user: { id: 'u1', name: 'Test', email: 't@t.com', role: 'USER' },
  loading: false,
  login: vi.fn(),
  register: vi.fn(),
  continueAsGuest: vi.fn(),
  logout: vi.fn(),
})

describe('CartDrawer', () => {
  it('renders cart items when open', () => {
    render(<MemoryRouter><CartDrawer open onClose={vi.fn()} /></MemoryRouter>)
    expect(screen.getByText('Cheese Burger')).toBeInTheDocument()
    expect(screen.getByText('₹398')).toBeInTheDocument()
  })

  it('shows empty state message when cart is empty', () => {
    vi.spyOn(CartContext, 'useCart').mockReturnValueOnce({ ...CartContext.useCart(), cart: { id: 'c1', items: [] }, itemCount: 0 })
    render(<MemoryRouter><CartDrawer open onClose={vi.fn()} /></MemoryRouter>)
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(<MemoryRouter><CartDrawer open onClose={onClose} /></MemoryRouter>)
    fireEvent.click(document.querySelector('.fixed.inset-0')!)
    expect(onClose).toHaveBeenCalled()
  })

  it('calls updateItem when quantity − button is clicked', () => {
    render(<MemoryRouter><CartDrawer open onClose={vi.fn()} /></MemoryRouter>)
    const decBtn = screen.getByText('−')
    fireEvent.click(decBtn)
    expect(updateItem).toHaveBeenCalledWith('ci-1', 1)
  })
})

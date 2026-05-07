import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import OrderTrackPage from '../pages/OrderTrackPage'
import * as ordersApi from '../api/orders'

vi.mock('socket.io-client', () => ({
  io: () => ({ emit: vi.fn(), on: vi.fn(), disconnect: vi.fn() }),
}))

const mockOrder = {
  id: 'order-abc',
  totalAmount: 398,
  status: 'PREPARING' as const,
  address: '123 Main St',
  createdAt: new Date().toISOString(),
  items: [
    {
      id: 'oi-1', menuItemId: 'item-1', quantity: 2, price: 199,
      menuItem: { id: 'item-1', name: 'Cheese Burger', description: '', price: 199, category: 'Burgers', available: true },
    },
  ],
}

vi.spyOn(ordersApi, 'getOrder').mockResolvedValue({ data: mockOrder } as any)

describe('OrderTrackPage', () => {
  function renderPage() {
    return render(
      <MemoryRouter initialEntries={['/orders/order-abc']}>
        <Routes>
          <Route path="/orders/:id" element={<OrderTrackPage />} />
        </Routes>
      </MemoryRouter>
    )
  }

  it('shows order items and total', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText(/cheese burger/i)).toBeInTheDocument())
    expect(screen.getByText('₹398.00')).toBeInTheDocument()
  })

  it('shows delivery address', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText(/123 Main St/i)).toBeInTheDocument())
  })

  it('shows loading state initially', () => {
    renderPage()
    expect(screen.getByText(/loading order/i)).toBeInTheDocument()
  })
})

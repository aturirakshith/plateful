import api from './axios'
import type { MenuItem } from './menu'

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED'

export interface OrderItem {
  id: string
  menuItemId: string
  quantity: number
  price: number
  menuItem: MenuItem
}

export interface Order {
  id: string
  totalAmount: number
  status: OrderStatus
  address: string
  createdAt: string
  items: OrderItem[]
}

export interface CreateOrderResponse {
  order: Order
  razorpayOrderId: string
  amount: number
  currency: string
}

/** Creates an order from the current cart and returns a Razorpay order to initiate payment */
export const createOrder = (address: string) =>
  api.post<CreateOrderResponse>('/api/orders', { address })

/** Verifies a Razorpay payment and marks the order as CONFIRMED */
export const verifyPayment = (data: {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
  orderId: string
}) => api.post('/api/payment/verify', data)

/** Fetches a single order by ID */
export const getOrder = (id: string) => api.get<Order>(`/api/orders/${id}`)

/** Fetches all orders for the current user */
export const getMyOrders = () => api.get<Order[]>('/api/orders/my')

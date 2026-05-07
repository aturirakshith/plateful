import api from './axios'
import type { MenuItem } from './menu'

export interface CartItem {
  id: string
  cartId: string
  menuItemId: string
  quantity: number
  menuItem: MenuItem
}

export interface Cart {
  id: string
  items: CartItem[]
}

/** Fetches the current user's cart */
export const getCart = () => api.get<Cart>('/api/cart')

/** Adds a menu item to the cart */
export const addToCart = (menuItemId: string, quantity = 1) =>
  api.post<Cart>('/api/cart/items', { menuItemId, quantity })

/** Updates the quantity of a cart item */
export const updateCartItem = (id: string, quantity: number) =>
  api.patch<Cart>(`/api/cart/items/${id}`, { quantity })

/** Removes a cart item */
export const removeCartItem = (id: string) => api.delete<Cart>(`/api/cart/items/${id}`)

/** Merges a guest cart into the logged-in user's cart */
export const mergeGuestCart = (sessionId: string) =>
  api.post<Cart>('/api/cart/merge', { sessionId })

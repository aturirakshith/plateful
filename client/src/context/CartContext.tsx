import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getCart, addToCart, updateCartItem, removeCartItem, type Cart } from '../api/cart'
import { useAuth } from './AuthContext'

interface CartContextValue {
  cart: Cart | null
  loading: boolean
  addItem: (menuItemId: string, quantity?: number) => Promise<void>
  updateItem: (id: string, quantity: number) => Promise<void>
  removeItem: (id: string) => Promise<void>
  refreshCart: () => Promise<void>
  itemCount: number
}

const CartContext = createContext<CartContextValue | null>(null)

/**
 * Provides cart state and mutation actions to the component tree.
 * Fetches the cart whenever the authenticated user changes.
 * Auto-creates a guest session if an unauthenticated user tries to add an item.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, continueAsGuest } = useAuth()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(false)

  const refreshCart = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await getCart()
      setCart(res.data)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { refreshCart() }, [refreshCart])

  /**
   * Adds a menu item to the cart.
   * If the user is not authenticated, silently creates a guest session first
   * so they can add items without being forced to log in.
   */
  async function addItem(menuItemId: string, quantity = 1) {
    if (!user) await continueAsGuest()
    const res = await addToCart(menuItemId, quantity)
    setCart(res.data)
  }

  /** Updates a cart item's quantity; removes it if quantity is 0 */
  async function updateItem(id: string, quantity: number) {
    const res = await updateCartItem(id, quantity)
    setCart(res.data)
  }

  /** Removes a cart item and refreshes state */
  async function removeItem(id: string) {
    const res = await removeCartItem(id)
    setCart(res.data)
  }

  const itemCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0

  return (
    <CartContext.Provider value={{ cart, loading, addItem, updateItem, removeItem, refreshCart, itemCount }}>
      {children}
    </CartContext.Provider>
  )
}

/** Returns the cart context. Must be used inside CartProvider. */
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

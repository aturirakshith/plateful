import React, { createContext, useContext, useEffect, useState } from 'react'
import { login as apiLogin, register as apiRegister, loginAsGuest, getMe, type User } from '../api/auth'
import { mergeGuestCart } from '../api/cart'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  continueAsGuest: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Provides authentication state and actions to the component tree.
 * Persists JWT in localStorage and restores user session on mount.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('plateful_token')
    if (!token) { setLoading(false); return }
    getMe()
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem('plateful_token'))
      .finally(() => setLoading(false))
  }, [])

  /** Authenticates with email/password and merges any guest cart */
  async function login(email: string, password: string) {
    const guestSessionId = localStorage.getItem('plateful_guest_session')
    const res = await apiLogin(email, password)
    localStorage.setItem('plateful_token', res.data.token)
    localStorage.removeItem('plateful_guest_session')
    setUser(res.data.user)
    if (guestSessionId) await mergeGuestCart(guestSessionId).catch(() => {})
  }

  /** Registers a new account and merges any guest cart */
  async function register(name: string, email: string, password: string) {
    const guestSessionId = localStorage.getItem('plateful_guest_session')
    const res = await apiRegister(name, email, password)
    localStorage.setItem('plateful_token', res.data.token)
    localStorage.removeItem('plateful_guest_session')
    setUser(res.data.user)
    if (guestSessionId) await mergeGuestCart(guestSessionId).catch(() => {})
  }

  /** Creates a guest session — cart is stored server-side by sessionId */
  async function continueAsGuest() {
    const res = await loginAsGuest()
    localStorage.setItem('plateful_token', res.data.token)
    localStorage.setItem('plateful_guest_session', res.data.sessionId)
    setUser(res.data.user)
  }

  function logout() {
    localStorage.removeItem('plateful_token')
    localStorage.removeItem('plateful_guest_session')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, continueAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Returns the auth context. Must be used inside AuthProvider. */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

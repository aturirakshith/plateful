import api from './axios'

export interface User {
  id: string
  name: string
  email: string
  role: 'USER' | 'GUEST' | 'ADMIN'
}

/** Registers a new user and returns a JWT token and user profile */
export const register = (name: string, email: string, password: string) =>
  api.post<{ token: string; user: User }>('/api/auth/register', { name, email, password })

/** Logs in with email/password and returns a JWT token and user profile */
export const login = (email: string, password: string) =>
  api.post<{ token: string; user: User }>('/api/auth/login', { email, password })

/** Creates a guest session and returns a JWT token and sessionId */
export const loginAsGuest = () =>
  api.post<{ token: string; sessionId: string }>('/api/auth/guest')

/** Returns the currently authenticated user's profile */
export const getMe = () => api.get<User>('/api/auth/me')

import api from './axios'

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  imageUrl?: string
  available: boolean
}

/** Fetches all available menu items, optionally filtered by category */
export const getMenu = (category?: string) =>
  api.get<MenuItem[]>('/api/menu', { params: category ? { category } : undefined })

/** Fetches a single menu item by ID */
export const getMenuItem = (id: string) => api.get<MenuItem>(`/api/menu/${id}`)

import axios from 'axios'

/** Axios instance pre-configured with the API base URL and auth header injection */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('plateful_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api

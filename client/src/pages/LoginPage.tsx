import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

type Tab = 'login' | 'register'

/**
 * Login/Register page with tabs for switching between forms.
 * Also provides a "Continue as Guest" option.
 * Redirects to the menu on successful authentication.
 */
export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register, continueAsGuest } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (tab === 'login') {
        await login(email, password)
      } else {
        await register(name, email, password)
      }
      toast.success('Welcome!')
      navigate('/menu')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleGuest() {
    setLoading(true)
    try {
      await continueAsGuest()
      navigate('/menu')
    } catch {
      toast.error('Failed to start guest session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center text-orange-500 mb-6">Plateful</h1>

        <div className="flex rounded-lg overflow-hidden border mb-6">
          {(['login', 'register'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-semibold capitalize transition ${tab === t ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              {t}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)}
              required className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400" />
          )}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            required className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            required className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400" />

          <button type="submit" disabled={loading}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-60 transition">
            {loading ? 'Please wait...' : tab === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <span className="text-gray-400 text-sm">or</span>
        </div>

        <button onClick={handleGuest} disabled={loading}
          className="mt-3 w-full border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">
          Continue as Guest
        </button>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

/**
 * Modal shown once per browser session on first visit.
 * Asks the user to log in or continue as a guest.
 * Dismissed automatically if the user is already authenticated.
 */
export default function WelcomeModal() {
  const { user, continueAsGuest } = useAuth()
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) return
    const seen = sessionStorage.getItem('plateful_welcomed')
    if (!seen) setVisible(true)
  }, [user])

  function dismiss() {
    sessionStorage.setItem('plateful_welcomed', '1')
    setVisible(false)
  }

  async function handleGuest() {
    dismiss()
    try {
      await continueAsGuest()
      toast.success('Browsing as guest — your cart will be saved!')
    } catch {
      toast.error('Could not start guest session')
    }
  }

  function handleLogin() {
    dismiss()
    navigate('/login')
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center animate-fade-in">
        <div className="text-5xl mb-3">🍽️</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Welcome to Plateful</h2>
        <p className="text-gray-400 text-sm mb-7">How would you like to continue?</p>

        <div className="space-y-3">
          <button
            onClick={handleLogin}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition"
          >
            Login / Register
          </button>
          <button
            onClick={handleGuest}
            className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition"
          >
            Continue as Guest
          </button>
        </div>

        <p className="text-xs text-gray-300 mt-5">
          Guests can browse and order — your cart is saved until you leave.
        </p>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

interface NavbarProps {
  onCartOpen: () => void
}

/**
 * Top navigation bar with links to the menu, order history,
 * a cart icon with item count badge, and auth controls.
 */
export default function Navbar({ onCartOpen }: NavbarProps) {
  const { user, logout } = useAuth()
  const { itemCount } = useCart()

  return (
    <nav className="bg-orange-500 text-white px-6 py-4 flex items-center justify-between shadow-md">
      <Link to="/" className="text-2xl font-bold tracking-tight">Plateful</Link>

      <div className="flex items-center gap-4">
        <Link to="/menu" className="hover:underline">Menu</Link>

        {user && (
          <Link to="/orders" className="hover:underline">My Orders</Link>
        )}

        <button onClick={onCartOpen} className="relative">
          <span className="text-2xl">🛒</span>
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-white text-orange-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </button>

        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-80">{user.name}</span>
            <button onClick={logout} className="bg-white text-orange-500 text-sm px-3 py-1 rounded-full font-semibold hover:bg-orange-100">
              Logout
            </button>
          </div>
        ) : (
          <Link to="/login" className="bg-white text-orange-500 text-sm px-3 py-1 rounded-full font-semibold hover:bg-orange-100">
            Login
          </Link>
        )}
      </div>
    </nav>
  )
}

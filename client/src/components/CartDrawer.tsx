import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

/**
 * Slide-over drawer that shows the current cart contents.
 * Allows quantity updates, item removal, and navigates to checkout.
 */
export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { cart, updateItem, removeItem } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const total = cart?.items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0) ?? 0

  function handleCheckout() {
    onClose()
    if (!user) {
      navigate('/login')
    } else {
      navigate('/checkout')
    }
  }

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />}
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-bold">Your Cart</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {!cart || cart.items.length === 0 ? (
            <p className="text-gray-400 text-center mt-10">Your cart is empty</p>
          ) : (
            cart.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{item.menuItem.name}</p>
                  <p className="text-orange-600 text-sm">₹{item.menuItem.price * item.quantity}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateItem(item.id, item.quantity - 1)} className="w-7 h-7 rounded-full border text-gray-500 hover:bg-gray-100">−</button>
                  <span className="w-5 text-center text-sm">{item.quantity}</span>
                  <button onClick={() => updateItem(item.id, item.quantity + 1)} className="w-7 h-7 rounded-full border text-gray-500 hover:bg-gray-100">+</button>
                </div>
                <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
              </div>
            ))
          )}
        </div>

        {cart && cart.items.length > 0 && (
          <div className="px-5 py-4 border-t">
            <div className="flex justify-between font-semibold text-gray-800 mb-3">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            <button onClick={handleCheckout} className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition">
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  )
}

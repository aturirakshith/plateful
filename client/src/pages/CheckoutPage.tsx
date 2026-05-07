import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useCart } from '../context/CartContext'
import { createOrder, verifyPayment } from '../api/orders'

declare global {
  interface Window {
    Razorpay: any
  }
}

/**
 * Checkout page with delivery address form.
 * Creates a Razorpay order, opens the payment modal, and verifies
 * the payment signature before redirecting to order tracking.
 */
export default function CheckoutPage() {
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const { cart, refreshCart } = useCart()
  const navigate = useNavigate()

  const total = cart?.items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0) ?? 0

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    if (!address.trim()) return toast.error('Please enter a delivery address')
    setLoading(true)

    try {
      const { data } = await createOrder(address)

      if (data.mockPayment) {
        // Mock mode: no Razorpay modal, auto-verify immediately
        await verifyPayment({ razorpayOrderId: data.razorpayOrderId, razorpayPaymentId: '', razorpaySignature: '', orderId: data.order.id })
        await refreshCart()
        toast.success('Order placed! (mock payment)')
        navigate(`/orders/${data.order.id}`)
        return
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: 'Plateful',
        description: 'Food Order',
        order_id: data.razorpayOrderId,
        handler: async (response: any) => {
          await verifyPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            orderId: data.order.id,
          })
          await refreshCart()
          toast.success('Payment successful!')
          navigate(`/orders/${data.order.id}`)
        },
        modal: { ondismiss: () => setLoading(false) },
        theme: { color: '#f97316' },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Checkout failed')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>

      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
        <h2 className="font-semibold text-gray-700 mb-3">Order Summary</h2>
        {cart?.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm text-gray-600 py-1">
            <span>{item.menuItem.name} × {item.quantity}</span>
            <span>₹{(item.menuItem.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold text-gray-800 border-t mt-3 pt-3">
          <span>Total</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
      </div>

      <form onSubmit={handleCheckout} className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
        <h2 className="font-semibold text-gray-700">Delivery Address</h2>
        <textarea rows={3} placeholder="Enter your full delivery address..."
          value={address} onChange={(e) => setAddress(e.target.value)}
          required className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />

        <button type="submit" disabled={loading}
          className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-60 transition">
          {loading ? 'Processing...' : `Pay ₹${total.toFixed(2)}`}
        </button>
      </form>
    </div>
  )
}

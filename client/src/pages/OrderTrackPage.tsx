import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import { getOrder, type Order, type OrderStatus } from '../api/orders'
import OrderStatus from '../components/OrderStatus'
import toast from 'react-hot-toast'

/**
 * Order tracking page. Fetches the order by ID and subscribes to
 * real-time socket updates so the status stepper updates live.
 */
export default function OrderTrackPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    getOrder(id)
      .then((res) => setOrder(res.data))
      .catch(() => toast.error('Order not found'))
      .finally(() => setLoading(false))

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:4000')
    socket.emit('join:order', id)

    socket.on('order:status_update', ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      if (orderId === id) {
        setOrder((prev) => prev ? { ...prev, status } : prev)
        toast(`Order status: ${status}`, { icon: '📦' })
      }
    })

    return () => { socket.disconnect() }
  }, [id])

  if (loading) return <div className="text-center py-20 text-gray-400">Loading order...</div>
  if (!order) return <div className="text-center py-20 text-red-400">Order not found</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Track Order</h1>
      <p className="text-gray-400 text-sm mb-8">Order #{order.id.slice(-8).toUpperCase()}</p>

      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
        <OrderStatus status={order.status} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="font-semibold text-gray-700 mb-3">Items</h2>
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm text-gray-600 py-1">
            <span>{item.menuItem.name} × {item.quantity}</span>
            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold text-gray-800 border-t mt-3 pt-3">
          <span>Total</span>
          <span>₹{order.totalAmount.toFixed(2)}</span>
        </div>
        <p className="text-sm text-gray-400 mt-2">📍 {order.address}</p>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyOrders, type Order } from '../api/orders'
import toast from 'react-hot-toast'

/** Displays all past orders for the current user with a link to track each one */
export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyOrders()
      .then((res) => setOrders(res.data))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20 text-gray-400">Loading orders...</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <p className="text-gray-400 text-center py-12">No orders yet. <Link to="/menu" className="text-orange-500 underline">Browse the menu</Link></p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} to={`/orders/${order.id}`}
              className="block bg-white rounded-2xl shadow-sm border p-5 hover:border-orange-300 transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800">Order #{order.id.slice(-8).toUpperCase()}</p>
                  <p className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-600' : order.status === 'FAILED' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                  {order.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">{order.items.length} item(s) · ₹{order.totalAmount.toFixed(2)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

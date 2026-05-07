import toast from 'react-hot-toast'
import { useCart } from '../context/CartContext'
import type { MenuItem as MenuItemType } from '../api/menu'

interface MenuItemProps {
  item: MenuItemType
}

/**
 * Displays a single menu item card with name, description, price, and
 * an "Add to Cart" button that triggers a toast notification on success.
 */
export default function MenuItem({ item }: MenuItemProps) {
  const { addItem } = useCart()

  async function handleAdd() {
    try {
      await addItem(item.id)
      toast.success(`${item.name} added to cart`)
    } catch {
      toast.error('Failed to add item')
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      {item.imageUrl && (
        <img src={item.imageUrl} alt={item.name} className="w-full h-40 object-cover" />
      )}
      {!item.imageUrl && (
        <div className="w-full h-40 bg-orange-50 flex items-center justify-center text-5xl">🍽️</div>
      )}

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-800 text-lg">{item.name}</h3>
        <p className="text-gray-500 text-sm mt-1 flex-1">{item.description}</p>

        <div className="mt-3 flex items-center justify-between">
          <span className="font-bold text-orange-600">₹{item.price}</span>
          <button
            onClick={handleAdd}
            className="bg-orange-500 text-white text-sm px-4 py-1.5 rounded-full hover:bg-orange-600 transition"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

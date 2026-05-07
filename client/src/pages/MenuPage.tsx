import { useEffect, useState } from 'react'
import { getMenu, type MenuItem as MenuItemType } from '../api/menu'
import MenuItem from '../components/MenuItem'
import toast from 'react-hot-toast'

/**
 * Menu browsing page. Fetches all menu items and supports
 * filtering by category via tab buttons.
 */
export default function MenuPage() {
  const [items, setItems] = useState<MenuItemType[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMenu()
      .then((res) => {
        setItems(res.data)
        const cats = ['All', ...new Set(res.data.map((i) => i.category))]
        setCategories(cats)
      })
      .catch(() => toast.error('Failed to load menu'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = activeCategory === 'All' ? items : items.filter((i) => i.category === activeCategory)

  if (loading) {
    return <div className="text-center py-20 text-gray-400 text-lg">Loading menu...</div>
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Our Menu</h1>

      <div className="flex gap-2 flex-wrap mb-8">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${activeCategory === cat ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-400 text-center py-12">No items in this category</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => <MenuItem key={item.id} item={item} />)}
        </div>
      )}
    </div>
  )
}

import { Link } from 'react-router-dom'

/** Landing hero page with a call-to-action to browse the menu */
export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-orange-50 to-white flex flex-col items-center justify-center text-center px-4">
      <div className="text-6xl mb-4">🍽️</div>
      <h1 className="text-5xl font-bold text-gray-800 mb-4">Welcome to Plateful</h1>
      <p className="text-gray-500 text-lg max-w-md mb-8">
        Delicious food, delivered fast. Browse our menu, build your cart, and enjoy.
      </p>
      <Link to="/menu"
        className="bg-orange-500 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-orange-600 transition shadow-md">
        View Menu
      </Link>
    </div>
  )
}

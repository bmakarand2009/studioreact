

import { withRole } from '@/components/guards/withRole';
import { useAuth } from '@/hooks/useAuth';
import { 
  ShoppingCart, 
  Package, 
  Star, 
  DollarSign,
  Search,
  Filter,
  Heart
} from 'lucide-react';

function StudentStore() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                My Store
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Browse and purchase educational materials and resources
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for books, courses, materials..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Filter className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400" />
                  Filter
                </button>
                <button className="flex items-center px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-500 transition-colors">
                  <Search className="h-5 w-5 mr-2" />
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Store Categories */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Textbooks', icon: '📚', count: 45 },
              { name: 'Online Courses', icon: '💻', count: 23 },
              { name: 'Study Materials', icon: '📝', count: 67 },
              { name: 'Tools & Software', icon: '🛠️', count: 34 }
            ].map((category, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
                <div className="text-4xl mb-3">{category.icon}</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{category.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{category.count} items</p>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Products */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Featured Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: 'Advanced Mathematics Textbook',
                category: 'Textbooks',
                price: 89.99,
                rating: 4.8,
                reviews: 124,
                image: '📖',
                description: 'Comprehensive guide to advanced mathematical concepts'
              },
              {
                name: 'Python Programming Course',
                category: 'Online Courses',
                price: 149.99,
                rating: 4.9,
                reviews: 89,
                image: '🐍',
                description: 'Learn Python from basics to advanced applications'
              },
              {
                name: 'Study Planner Pro',
                category: 'Tools & Software',
                price: 29.99,
                rating: 4.7,
                reviews: 56,
                image: '📅',
                description: 'Digital planner to organize your academic life'
              },
              {
                name: 'Chemistry Lab Manual',
                category: 'Study Materials',
                price: 45.99,
                rating: 4.6,
                reviews: 78,
                image: '🧪',
                description: 'Complete lab manual for chemistry experiments'
              },
              {
                name: 'Business Strategy Course',
                category: 'Online Courses',
                price: 199.99,
                rating: 4.9,
                reviews: 203,
                image: '💼',
                description: 'Master business strategy and management'
              },
              {
                name: 'Scientific Calculator',
                category: 'Tools & Software',
                price: 39.99,
                rating: 4.5,
                reviews: 92,
                image: '🧮',
                description: 'Professional scientific calculator for students'
              }
            ].map((product, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="text-center mb-4">
                    <div className="text-6xl mb-3">{product.image}</div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{product.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{product.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{product.category}</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-900 dark:text-white ml-1">{product.rating}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">({product.reviews})</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      <DollarSign className="inline h-5 w-5" />
                      {product.price}
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                        <Heart className="h-5 w-5" />
                      </button>
                      <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-500 transition-colors">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shopping Cart Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Shopping Cart</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">3 items</span>
          </div>
          <div className="mt-4 space-y-3">
            {[
              { name: 'Mathematics Textbook', price: 89.99, quantity: 1 },
              { name: 'Python Course', price: 149.99, quantity: 1 },
              { name: 'Study Planner', price: 29.99, quantity: 1 }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    <DollarSign className="inline h-4 w-4" />
                    {item.price}
                  </p>
                </div>
              </div>
            ))}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">Total:</span>
                <span className="text-2xl font-bold text-primary-500">
                  <DollarSign className="inline h-6 w-6" />
                  269.97
                </span>
              </div>
              <button className="w-full mt-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-500 transition-colors">
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRole(StudentStore, { allowedRoles: ['ROLE_STUDENT'] });

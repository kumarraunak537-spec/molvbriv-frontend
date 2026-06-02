import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { supabase } from '../supabaseClient'
import { useCart } from '../context/CartContext'

export default function AllProductsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const handleQuickShop = (e, product) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart({
      id: product.id,
      name: product.title,
      price: product.price,
      description: product.description || '',
      image: (product.images && product.images[0]) || 'https://images.unsplash.com/photo-1515562141589-67f0d954ca94?w=600&h=700&fit=crop',
    })
    navigate('/cart')
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    setSearchQuery(params.get('search') || '')
  }, [location.search])

  useEffect(() => {
    window.scrollTo(0, 0)
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      console.error('Error fetching products:', err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProducts = products.filter(product => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      product.title?.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query) ||
      product.tags?.some(tag => tag?.toLowerCase().includes(query)) ||
      product.material?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="bg-background text-on-background selection:bg-secondary/20 font-body">
      <Navbar />

      <div className="pt-28 md:pt-24 min-h-screen">
        <section className="py-12 md:py-32 px-5 md:px-12 bg-surface">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-16 gap-4 md:gap-6">
              <div className="max-w-xl">
                <h2 className="text-2xl md:text-4xl font-manrope text-primary mb-3 md:mb-6">
                  {searchQuery ? `Search Results for "${searchQuery}"` : 'All Products'}
                </h2>
                {searchQuery && (
                  <p className="text-on-surface-variant text-sm md:text-base">
                    Showing products that matched your search query.
                  </p>
                )}
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-surface-container-low rounded-lg border border-dashed border-black/10">
                <p className="text-on-surface-variant italic">
                  {searchQuery ? `No products found matching "${searchQuery}".` : 'Our new collection is coming soon.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                {filteredProducts.map(product => (
                  <Link key={product.id} to={`/product/${product.id}`} className="group cursor-pointer">
                    <div className="relative overflow-hidden mb-6 bg-surface-container-low aspect-[3/4]">
                      <img 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        alt={product.title} 
                        src={(product.images && product.images[0]) || 'https://images.unsplash.com/photo-1515562141589-67f0d954ca94?w=600&h=700&fit=crop'}
                      />
                      {(product.tags && product.tags.length > 0) && (
                        <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 text-[10px] uppercase tracking-tighter text-black">
                          {(product.tags && product.tags[0])}
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-white/40 backdrop-blur-md">
                        <button 
                          onClick={(e) => handleQuickShop(e, product)}
                          className="w-full bg-primary text-white py-3 text-[10px] uppercase tracking-widest hover:bg-[#765931] transition-colors"
                        >
                          Quick Shop
                        </button>
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className="text-primary font-body font-semibold text-sm mb-1">{product.title}</h3>
                      <div className="flex items-center justify-center gap-2">
                        <p className="text-secondary font-manrope text-lg">₹{(product.price || 0).toLocaleString()}</p>
                        {product.compare_price && Number(product.compare_price) > Number(product.price) && (
                          <p className="text-on-surface-variant font-manrope text-sm line-through opacity-60">₹{Number(product.compare_price).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}

import React, { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useCart } from '../context/CartContext.jsx'
import { supabase } from '../supabaseClient'

export default function CollectionsPage() {
  const { wishlist, toggleWishlist } = useCart()
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState('newest')
  const [categories, setCategories] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from('products').select('*')
      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      console.error('Error fetching products:', err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCategory = (c) => {
    setCategories(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }

  const filteredProducts = useMemo(() => {
    let result = [...products]

    if (categories.length > 0) {
      result = result.filter(p => categories.some(c => c.toLowerCase() === (p.category || '').toLowerCase()))
    }

    if (sortBy === 'high') result.sort((a, b) => (b.price || 0) - (a.price || 0))
    else if (sortBy === 'low') result.sort((a, b) => (a.price || 0) - (b.price || 0))
    else result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    return result
  }, [products, sortBy, categories])

  return (
    <div className="bg-cream min-h-screen">
      <Navbar />

      <div className="pt-28 md:pt-32 max-w-[1440px] mx-auto px-5 lg:px-12 pb-6 lg:pb-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-4 md:gap-6">
          <div className="max-w-xl">
            <h2 className="text-2xl md:text-4xl font-manrope text-primary mb-3 md:mb-6">Our Collections</h2>
          </div>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden flex items-center gap-2 mb-6 text-sm font-inter text-primary border border-outline-variant/30 px-4 py-2.5 w-full justify-center"
        >
          <span className="material-symbols-outlined text-sm">tune</span>
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 lg:gap-10">
          <aside className={`space-y-8 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div>
              <h3 className="font-inter text-[13px] font-medium text-primary mb-4">Sort By</h3>
              <div className="space-y-3">
                {[
                  { label: 'Newest Curations', value: 'newest' },
                  { label: 'Price: High to Low', value: 'high' },
                  { label: 'Price: Low to High', value: 'low' },
                ].map(opt => (
                  <label key={opt.value} className="cursor-pointer group block">
                    <span className={`font-inter text-[12px] uppercase tracking-widest transition-all duration-300 ${sortBy === opt.value ? 'text-primary font-bold border-b border-primary pb-1' : 'text-[#A0A090] hover:text-primary'}`}>
                      {opt.label}
                    </span>
                    <input type="radio" name="sort" value={opt.value} checked={sortBy === opt.value}
                      onChange={() => setSortBy(opt.value)} className="hidden" />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-inter text-[13px] font-medium text-primary mb-4">Category</h3>
              <div className="space-y-3">
                {['Jhumka', 'Earrings', 'Necklace', 'Bangles', 'Rings', 'Maang Tikka', 'Bridal Set'].map(c => (
                  <label key={c} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center transition-colors
                      ${categories.includes(c) ? 'border-primary bg-primary' : 'border-[#C0B8A8] group-hover:border-primary'}`}>
                      {categories.includes(c) && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                    <span className={`font-inter text-[12px] ${categories.includes(c) ? 'text-primary font-medium' : 'text-[#A0A090]'}`}>{c}</span>
                    <input type="checkbox" checked={categories.includes(c)}
                      onChange={() => toggleCategory(c)} className="hidden" />
                  </label>
                ))}
              </div>
            </div>
          </aside>

          <div>
            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {filteredProducts.map(product => (
                  <Link to={`/product/${product.id}`} key={product.id} className="group">
                    <div className={`relative aspect-[4/5] bg-surface-container-low rounded-lg overflow-hidden`}>
                      <img
                        src={(product.images && product.images[0]) || 'https://images.unsplash.com/photo-1515562141589-67f0d954ca94?w=600&h=700&fit=crop'}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <button
                        onClick={(e) => { e.preventDefault(); toggleWishlist(product.id) }}
                        className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center bg-[#fdf9f3]/90 hover:bg-[#fdf9f3] border border-black/10 hover:scale-110 hover:shadow-md transition-all duration-300 group/heart"
                        aria-label="Toggle Wishlist"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24"
                          className="transition-transform duration-300 group-hover/heart:scale-110"
                          fill={wishlist.includes(product.id) ? '#ef4444' : 'none'}
                          stroke={wishlist.includes(product.id) ? '#ef4444' : '#000000'}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                      </button>
                    </div>
                    <div className="mt-4 text-center">
                      <p className="font-inter text-[9px] uppercase tracking-[0.15em] text-secondary mb-1">{product.category}</p>
                      <h3 className="font-manrope text-[16px] text-primary font-semibold">{product.title}</h3>
                      <p className="font-inter text-[13px] text-on-surface-variant mt-1">₹{(product.price || 0).toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {!isLoading && filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <p className="font-manrope text-[24px] text-on-surface-variant italic">No pieces match your criteria</p>
                <p className="font-inter text-[12px] text-on-surface-variant mt-2">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer variant="collections" />
    </div>
  )
}

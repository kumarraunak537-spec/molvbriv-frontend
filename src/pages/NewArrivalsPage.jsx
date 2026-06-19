import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { supabase, getCachedProducts, getCachedRatingsMap } from '../supabaseClient'
import { useCart } from '../context/CartContext'
import { analytics } from '../services/analytics'
import { updateSEO } from '../utils/seo'


export default function NewArrivalsPage() {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [ratingsMap, setRatingsMap] = useState({})

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
    window.scrollTo(0, 0)
    fetchNewArrivals()
    fetchRatings()
    updateSEO({
      title: "New Arrivals — Molvbriv",
      description: "Explore the latest additions to Molvbriv. Handcrafted luxury jewelry freshly curated for our signature collection.",
      canonicalUrl: window.location.origin + "/new-arrivals"
    })
  }, [])

  const fetchNewArrivals = async () => {
    setIsLoading(true)
    try {
      const data = await getCachedProducts()
      const sliced = data ? data.slice(0, 8) : []
      setProducts(sliced)
      analytics.trackViewItemList(sliced, 'New Arrivals')
    } catch (err) {
      console.error('Error fetching new arrivals:', err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRatings = async () => {
    try {
      const lookup = await getCachedRatingsMap()
      setRatingsMap(lookup || {})
    } catch (err) {
      console.error('Error fetching ratings:', err.message)
    }
  }

  return (
    <div className="bg-background text-on-background selection:bg-secondary/20 font-body">
      <Navbar />

      <div className="pt-28 md:pt-24 min-h-screen">
        <section className="py-12 md:py-32 px-5 md:px-12 bg-surface">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-16 gap-4 md:gap-6">
              <div className="max-w-xl">
                <h2 className="text-2xl md:text-4xl font-manrope text-primary mb-3 md:mb-6">New Arrivals</h2>
                <p className="text-on-surface-variant text-sm md:text-base">The latest curators' picks, fresh from the atelier. Discover pieces that define this season's brilliance.</p>
              </div>
              <Link className="text-secondary uppercase tracking-widest text-xs font-bold hover:mr-2 transition-all" to="/all-products">View All Products →</Link>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-surface-container-low rounded-lg border border-dashed border-black/10">
                <p className="text-on-surface-variant italic">New masterpieces are being crafted.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                {products.map(product => (
                  <div key={product.id} className="group cursor-pointer">
                    <div className="relative overflow-hidden mb-6 bg-surface-container-low aspect-[3/4]">
                      <Link to={`/product/${product.id}`}>
                        <img 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          alt={product.title} 
                          src={(product.images && product.images[0]) || 'https://images.unsplash.com/photo-1515562141589-67f0d954ca94?w=600&h=700&fit=crop'}
                        />
                      </Link>
                      <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 text-[10px] uppercase tracking-tighter text-black">New</div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-white/40 backdrop-blur-md">
                        <button 
                          onClick={(e) => handleQuickShop(e, product)}
                          className="w-full bg-primary text-white py-3 text-[10px] uppercase tracking-widest hover:bg-[#765931] transition-colors"
                        >
                          Quick Shop
                        </button>
                      </div>
                    </div>
                    <Link to={`/product/${product.id}`} className="text-center block">
                      <h3 className="text-primary font-body font-semibold text-sm mb-1">{product.title}</h3>
                      <p className="text-secondary font-manrope text-lg">₹{(product.price || 0).toLocaleString()}</p>
                      {ratingsMap[product.id] && ratingsMap[product.id].count > 0 && (
                        <div className="flex items-center justify-center gap-1 mt-1.5 text-secondary">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => {
                              const avg = ratingsMap[product.id].sum / ratingsMap[product.id].count;
                              return (
                                <span key={star} className={`material-symbols-outlined text-[10px] ${star <= Math.round(avg) ? 'fill-secondary text-secondary' : 'text-outline-variant/30'}`}>
                                  star
                                </span>
                              );
                            })}
                          </div>
                          <span className="text-[10px] text-on-surface-variant font-medium">({ratingsMap[product.id].count})</span>
                        </div>
                      )}
                    </Link>
                  </div>
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

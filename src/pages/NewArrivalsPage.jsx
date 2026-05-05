import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { supabase } from '../supabaseClient'

export default function NewArrivalsPage() {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
    fetchNewArrivals()
  }, [])

  const fetchNewArrivals = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8)
      
      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      console.error('Error fetching new arrivals:', err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-background text-on-background selection:bg-secondary/20 font-body">
      <Navbar />

      <div className="pt-28 md:pt-24 min-h-screen">
        <section className="py-12 md:py-32 px-5 md:px-12 bg-surface border-t border-black/5">
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
                  <Link key={product.id} to={`/product/${product.id}`} className="group cursor-pointer">
                    <div className="relative overflow-hidden mb-6 bg-surface-container-low aspect-[3/4]">
                      <img 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        alt={product.title} 
                        src={(product.images && product.images[0]) || 'https://images.unsplash.com/photo-1515562141589-67f0d954ca94?w=600&h=700&fit=crop'}
                      />
                      <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 text-[10px] uppercase tracking-tighter text-black">New</div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-white/40 backdrop-blur-md">
                        <button className="w-full bg-primary text-white py-3 text-[10px] uppercase tracking-widest">Quick Shop</button>
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className="text-primary font-body font-semibold text-sm mb-1">{product.title}</h3>
                      <p className="text-secondary font-manrope text-lg">₹{(product.price || 0).toLocaleString()}</p>
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

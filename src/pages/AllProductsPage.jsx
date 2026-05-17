import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { supabase } from '../supabaseClient'

export default function AllProductsPage() {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  
  const ITEMS_PER_PAGE = 12

  useEffect(() => {
    window.scrollTo(0, 0)
    fetchProducts(0)
  }, [])

  const fetchProducts = async (pageIndex) => {
    if (pageIndex === 0) setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .range(pageIndex * ITEMS_PER_PAGE, (pageIndex + 1) * ITEMS_PER_PAGE - 1)
      
      if (error) throw error
      
      if (data.length < ITEMS_PER_PAGE) {
        setHasMore(false)
      } else {
        setHasMore(true)
      }
      
      if (pageIndex === 0) {
        setProducts(data || [])
      } else {
        setProducts(prev => [...prev, ...(data || [])])
      }
    } catch (err) {
      console.error('Error fetching products:', err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchProducts(nextPage)
  }

  return (
    <div className="bg-background text-on-background selection:bg-secondary/20 font-body">
      <Navbar />

      <div className="pt-28 md:pt-24 min-h-screen">
        <section className="py-12 md:py-32 px-5 md:px-12 bg-surface">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-16 gap-4 md:gap-6">
              <div className="max-w-xl">
                <h2 className="text-2xl md:text-4xl font-manrope text-primary mb-3 md:mb-6">All Products</h2>
                <p className="text-on-surface-variant text-sm md:text-base">Explore our entire collection of rare stones and precision-crafted 18k gold pieces. Every item tells a story.</p>
              </div>
            </div>
            
            {isLoading && page === 0 ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-surface-container-low rounded-lg border border-dashed border-black/10">
                <p className="text-on-surface-variant italic">Our new collection is coming soon.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                  {products.map((product, index) => (
                    <Link key={`${product.id}-${index}`} to={`/product/${product.id}`} className="group cursor-pointer">
                      <div className="relative overflow-hidden mb-6 bg-surface-container-low aspect-[3/4]">
                        <img 
                          loading="lazy"
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
                          <button className="w-full bg-primary text-white py-3 text-[10px] uppercase tracking-widest">Quick Shop</button>
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
                
                {hasMore && (
                  <div className="mt-16 flex justify-center">
                    <button 
                      onClick={handleLoadMore}
                      className="border border-primary text-primary px-10 py-4 text-xs tracking-widest uppercase hover:bg-primary hover:text-white transition-all duration-300"
                    >
                      Load More
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}

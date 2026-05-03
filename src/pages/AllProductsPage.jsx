import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { products } from '../data/products'

export default function AllProductsPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="bg-background text-on-background selection:bg-secondary/20 font-body">
      <Navbar />

      {/* Adding padding top to account for the fixed navbar */}
      <div className="pt-28 md:pt-24 min-h-screen">
        {/* All Products Grid */}
        <section className="py-12 md:py-32 px-5 md:px-12 bg-surface border-t border-black/5">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-16 gap-4 md:gap-6">
              <div className="max-w-xl">
                <h2 className="text-2xl md:text-4xl font-manrope text-primary mb-3 md:mb-6">All Products</h2>
                <p className="text-on-surface-variant text-sm md:text-base">Explore our entire collection of rare stones and precision-crafted 18k gold pieces. Every item tells a story.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {products.map(product => (
                <Link key={product.id} to={`/product/${product.id}`} className="group cursor-pointer">
                  <div className="relative overflow-hidden mb-6 bg-surface-container-low aspect-[3/4]">
                    <img 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      alt={product.name} 
                      src={product.image}
                    />
                    {product.tag && (
                      <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 text-[10px] uppercase tracking-tighter text-black">
                        {product.tag}
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-white/40 backdrop-blur-md">
                      <button className="w-full bg-primary text-white py-3 text-[10px] uppercase tracking-widest">Quick Shop</button>
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-primary font-body font-semibold text-sm mb-1">{product.name}</h3>
                    <p className="text-secondary font-manrope text-lg">₹{product.price.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}

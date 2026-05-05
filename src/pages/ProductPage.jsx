import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useCart } from '../context/CartContext'
import { supabase } from '../supabaseClient'

export default function ProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [addedToCart, setAddedToCart] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    fetchProductDetails()
  }, [id])

  const fetchProductDetails = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      setProduct(data)
    } catch (err) {
      console.error('Error fetching product:', err.message)
      // If product not found, we can stay on page or redirect
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!product) return
    addToCart({
      id: product.id,
      name: product.title,
      price: product.price,
      description: 'Crafted from responsibly sourced materials with timeless precision.',
      image: (product.images && product.images[0]),
    })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const handleBuyNow = () => {
    if (!product) return
    addToCart({
      id: product.id,
      name: product.title,
      price: product.price,
      description: 'Crafted from responsibly sourced materials with timeless precision.',
      image: (product.images && product.images[0]),
    })
    navigate('/cart') // Redirecting to cart for checkout flow
  }

  if (isLoading) {
    return (
      <div className="bg-surface min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="bg-surface min-h-screen">
        <Navbar />
        <div className="pt-40 text-center">
          <h2 className="text-2xl font-manrope text-primary mb-4">Product Not Found</h2>
          <Link to="/all-products" className="text-secondary underline">View All Products</Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="bg-surface font-body text-on-surface antialiased">
      <Navbar />

      <main className="pt-24 md:pt-32 pb-12 md:pb-20 max-w-7xl mx-auto px-5 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 mb-16 md:mb-24">
          <div className="lg:col-span-7 space-y-6">
            <div className="relative aspect-[4/5] bg-surface-container-low overflow-hidden group rounded-xl">
              <img 
                alt={product.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                src={(product.images && product.images[0]) || 'https://images.unsplash.com/photo-1515562141589-67f0d954ca94?w=800&h=900&fit=crop'} 
              />
              <div className="absolute top-6 right-6">
                <button className="px-4 py-2 bg-white/20 backdrop-blur-lg border border-white/10 text-white text-[10px] uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">360</span>
                  View 360°
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col">
            <div className="mb-8">
              <span className="text-secondary text-[10px] uppercase tracking-[0.2em] font-bold">{(product.tags && product.tags[0]) || 'The Eternal Collection'}</span>
              <h1 className="text-3xl md:text-5xl font-manrope text-primary mt-3 md:mt-4 mb-2 leading-tight">{product.title}</h1>
              <div className="flex items-center gap-4 mt-6">
                <span className="text-2xl md:text-3xl font-body text-secondary">₹{(product.price || 0).toLocaleString()}</span>
                <span className="px-3 py-1 bg-secondary-container/30 text-on-secondary-container text-[10px] uppercase tracking-widest font-bold">Limited Release</span>
              </div>
            </div>

            <div className="space-y-8 mb-10">
              <div className="p-6 bg-surface-container-low border-l-2 border-secondary/20">
                <p className="text-sm text-on-surface-variant leading-relaxed font-inter">
                  Crafted from responsibly sourced {product.material || 'precious metal'}, the {product.title} features exceptional craftsmanship and precision. A testament to quiet luxury and timeless elegance.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-outline mb-1">Material</p>
                  <p className="font-body text-sm font-medium capitalize">{product.material || '18k Gold'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-outline mb-1">Category</p>
                  <p className="font-body text-sm font-medium capitalize">{product.category || 'Jewelry'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-outline mb-1">Clarity</p>
                  <p className="font-body text-sm font-medium">VVS1 - Exceptional</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-outline mb-1">Provenance</p>
                  <p className="font-body text-sm font-medium">Atelier Handcrafted</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-12">
              <div className="flex gap-4">
                <button onClick={handleAddToCart} className="flex-1 bg-primary text-on-primary py-5 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-primary-container transition-all duration-300 shadow-xl shadow-primary/10">
                  {addedToCart ? 'Added to Cart ✓' : 'Add to Cart'}
                </button>
                <button className="w-16 flex items-center justify-center border border-outline-variant/30 hover:bg-surface-container-highest transition-all">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                </button>
              </div>
              <button onClick={handleBuyNow} className="w-full border border-primary text-primary py-5 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-primary hover:text-white transition-all duration-500">
                BUY NOW
              </button>
            </div>

            <div className="pt-6 md:pt-8 border-t border-surface-variant flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-xl">verified</span>
                <span className="text-[10px] uppercase tracking-widest font-medium">Authenticity Guaranteed</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-xl">local_shipping</span>
                <span className="text-[10px] uppercase tracking-widest font-medium">Insured Worldwide Delivery</span>
              </div>
            </div>
          </div>
        </div>

        <section className="mb-16 md:mb-32">
          <h2 className="text-2xl font-manrope text-primary mb-12 text-center">Styling &amp; Provenance</h2>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 h-auto md:h-[600px]">
            <div className="md:col-span-8 relative overflow-hidden bg-surface-container-low p-8 md:p-12 flex flex-col justify-end group min-h-[300px] md:min-h-0">
              <img alt="Styling context" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwUeZA8mdm1H6cnnCHjcwoXMvXsGdI-y1ZqkqVkwx8ajizi1ASgGCuz4HdK4CXPc8uMaX1fTHk-YS84ZYUxvIIpTYWUe_nq74oyzZakmWzTAgHirdbecSinsQ5OXa8xLUKFr5f6Cn2ocwOOFT3J1R218N7_nDXKMFLC-mMr9DZSgFVh-_e2zTlMXdZdoeLJ3YLF3CSfRWXNJ9etyOuc28PGA3wJL2t2Oi_H1Y-PAWAHcOfOjC2GLkiu8QMjzfNo5Zw6DfqVu1PFZk" />
              <div className="relative z-10 max-w-md">
                <span className="text-secondary text-[10px] uppercase tracking-widest mb-4 block">The Curator's Journal</span>
                <h3 className="text-3xl font-manrope text-primary mb-4 italic">The Art of Layering: Gold &amp; Light</h3>
                <p className="text-sm text-on-surface-variant mb-6 font-inter">Explore how the {product.title} interacts with different necklines and textures in our latest editorial feature.</p>
                <Link to="#" className="text-[10px] font-bold uppercase tracking-widest border-b border-primary pb-1">Read the entry</Link>
              </div>
            </div>
            <div className="md:col-span-4 bg-[#1F3D2B] p-6 md:p-10 flex flex-col justify-between text-white min-h-[250px] md:min-h-0">
              <div>
                <span className="material-symbols-outlined text-secondary-container text-4xl mb-6">auto_awesome</span>
                <h3 className="text-xl font-manrope mb-4">Certified GIA Excellence</h3>
                <p className="text-sm text-on-primary-container leading-relaxed font-inter">Each Molvbriv diamond over 0.5ct is accompanied by a GIA grading report and a digital certificate of origin, recorded on our private blockchain for absolute provenance.</p>
              </div>
              <button className="text-[10px] uppercase tracking-[0.2em] font-bold border border-white/20 py-4 hover:bg-white/10 transition-colors">
                View Certificate Specimen
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

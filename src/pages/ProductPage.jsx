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
  const [selectedImage, setSelectedImage] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [recentProducts, setRecentProducts] = useState([])

  useEffect(() => {
    window.scrollTo(0, 0)
    setIsLiked(false)
    fetchProductDetails()
  }, [id])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('recentProducts')
      if (stored) {
        setRecentProducts(JSON.parse(stored))
      }
    } catch (err) {}
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

      try {
        const stored = localStorage.getItem('recentProducts')
        let recents = stored ? JSON.parse(stored) : []
        recents = recents.filter(p => p.id !== data.id)
        recents.unshift({
          id: data.id,
          title: data.title,
          price: data.price,
          compare_price: data.compare_price,
          image: data.images && data.images.length > 0 ? data.images[0] : 'https://images.unsplash.com/photo-1515562141589-67f0d954ca94?w=800&h=900&fit=crop'
        })
        if (recents.length > 4) recents = recents.slice(0, 4)
        localStorage.setItem('recentProducts', JSON.stringify(recents))
      } catch (err) {}
    } catch (err) {
      console.error('Error fetching product:', err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const productImages = product?.images && product.images.length > 0 
    ? product.images 
    : ['https://images.unsplash.com/photo-1515562141589-67f0d954ca94?w=800&h=900&fit=crop']

  const handleAddToCart = () => {
    if (!product) return
    addToCart({
      id: product.id,
      name: product.title,
      price: product.price,
      description: product.description || '',
      image: productImages[0],
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
      description: product.description || '',
      image: productImages[0],
    })
    navigate('/cart')
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
          <div className="lg:col-span-7 space-y-4">
            {/* Main Image */}
            <div className="relative aspect-[4/5] bg-surface-container-low overflow-hidden group rounded-xl">
              <img 
                alt={product.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                src={productImages[selectedImage]} 
              />
            </div>
            {/* Thumbnail Gallery */}
            {productImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {productImages.map((img, i) => (
                  <button 
                    key={i} 
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${selectedImage === i ? 'border-secondary opacity-100' : 'border-transparent opacity-60 hover:opacity-90'}`}
                  >
                    <img src={img} alt={`${product.title} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 flex flex-col">
            <div className="mb-8">
              {product.tags && product.tags.length > 0 && (
                <span className="text-secondary text-[10px] uppercase tracking-[0.2em] font-bold">{product.tags[0]}</span>
              )}
              <h1 className="text-3xl md:text-5xl font-manrope text-primary mt-3 md:mt-4 mb-2 leading-tight">{product.title}</h1>
              <div className="flex items-center gap-4 mt-6">
                <span className="text-2xl md:text-3xl font-body text-secondary">₹{(product.price || 0).toLocaleString()}</span>
                {product.compare_price && Number(product.compare_price) > Number(product.price) && (
                  <span className="text-lg md:text-xl font-body text-on-surface-variant line-through opacity-60">₹{Number(product.compare_price).toLocaleString()}</span>
                )}
                <span className="px-3 py-1 bg-secondary-container/30 text-on-secondary-container text-[10px] uppercase tracking-widest font-bold">Limited Release</span>
              </div>
            </div>

            <div className="space-y-8 mb-10">
              <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-outline mb-1">Material</p>
                  <p className="font-body text-sm font-medium capitalize">{product.material || 'Gold Plated'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-outline mb-1">Stock</p>
                  <p className="font-body text-sm font-medium">{product.stock > 0 ? `${product.stock} available` : 'Out of stock'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-12">
              <div className="flex gap-4">
                <button onClick={handleAddToCart} className="flex-1 bg-primary text-on-primary py-5 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-primary-container transition-all duration-300 shadow-xl shadow-primary/10">
                  {addedToCart ? 'Added to Cart ✓' : 'Add to Cart'}
                </button>
                <button 
                  onClick={() => setIsLiked(!isLiked)} 
                  className={`w-16 flex items-center justify-center border transition-all ${isLiked ? 'border-[#8B0000] bg-[#8B0000]/5' : 'border-outline-variant/30 hover:bg-surface-container-highest'}`}
                >
                  <span className="material-symbols-outlined" style={{ color: isLiked ? '#8B0000' : 'var(--secondary)', fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                </button>
              </div>
              <button onClick={handleBuyNow} className="w-full border border-primary text-primary py-5 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-primary hover:text-white transition-all duration-500">
                BUY NOW
              </button>
            </div>

            {/* Product Description from DB */}
            {product.description && (
              <div className="mb-12 p-6 bg-surface-container-low border-l-2 border-secondary/20">
                <p className="text-sm text-on-surface-variant leading-relaxed font-inter whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

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

        {/* Recently Viewed Products */}
        {recentProducts.filter(rp => rp.id !== id).length > 0 && (
          <div className="pt-16 md:pt-24 border-t border-surface-variant">
            <h2 className="text-2xl md:text-3xl font-manrope text-primary mb-8 text-center">Recently Viewed</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {recentProducts.filter(rp => rp.id !== id).slice(0, 4).map(rp => (
                <Link to={`/product/${rp.id}`} key={rp.id} className="group cursor-pointer">
                  <div className="aspect-[4/5] bg-surface-container-low overflow-hidden rounded-xl mb-4">
                    <img 
                      src={rp.image} 
                      alt={rp.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                  </div>
                  <h3 className="font-manrope text-primary text-sm md:text-base truncate">{rp.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-body text-secondary text-sm">₹{(rp.price || 0).toLocaleString()}</span>
                    {rp.compare_price && Number(rp.compare_price) > Number(rp.price) && (
                      <span className="text-xs text-on-surface-variant line-through opacity-60">₹{Number(rp.compare_price).toLocaleString()}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}


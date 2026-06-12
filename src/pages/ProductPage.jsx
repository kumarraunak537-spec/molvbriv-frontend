import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useCart } from '../context/CartContext'
import { supabase } from '../supabaseClient'
import { analytics } from '../services/analytics'
import { updateSEO } from '../utils/seo'
import ProductReviews from '../components/ProductReviews'


export default function ProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, wishlist, toggleWishlist } = useCart()
  const [product, setProduct] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [addedToCart, setAddedToCart] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [recentProducts, setRecentProducts] = useState([])
  const [showDetails, setShowDetails] = useState(false)
  const [showDelivery, setShowDelivery] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [activeBottomTab, setActiveBottomTab] = useState('related')
  const [summary, setSummary] = useState({ averageRating: 0, totalRatings: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } })

  useEffect(() => {
    window.scrollTo(0, 0)
    setIsLiked(false)
    fetchProductDetails()
  }, [id])

  useEffect(() => {
    if (product) {
      const canonicalUrl = `${window.location.origin}/product/${product.id}`
      const imageUrl = product.images && product.images.length > 0 
        ? product.images[0] 
        : 'https://images.unsplash.com/photo-1515562141589-67f0d954ca94?w=1200&h=630&fit=crop'
      
      updateSEO({
        title: `${product.title} — Molvbriv`,
        description: product.description || `Buy ${product.title} on Molvbriv. Luxury fine jewelry crafted with timeless elegance.`,
        canonicalUrl,
        ogType: "product",
        ogImage: imageUrl
      })

      // Dynamic Product Schema (JSON-LD) injection
      const schemaId = 'product-jsonld'
      let script = document.getElementById(schemaId)
      if (!script) {
        script = document.createElement('script')
        script.id = schemaId
        script.type = 'application/ld+json'
        document.head.appendChild(script)
      }

      const productSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.title,
        "image": product.images && product.images.length > 0 ? product.images : [imageUrl],
        "description": product.description || `Luxury fine jewelry - ${product.title} on Molvbriv.`,
        "sku": product.id,
        "offers": {
          "@type": "Offer",
          "url": canonicalUrl,
          "priceCurrency": "INR",
          "price": product.price,
          "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "priceValidUntil": "2027-12-31"
        }
      }

      script.textContent = JSON.stringify(productSchema)
    }

    return () => {
      // Cleanup schema script tag when component unmounts or product changes
      const script = document.getElementById('product-jsonld')
      if (script) {
        script.remove()
      }
    }
  }, [product])

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
      setIsLoading(false) // Set loading to false as soon as the main product data is set

      // Track view item in background
      analytics.trackViewItem({
        id: data.id,
        name: data.title,
        price: data.price,
        category: data.category,
      })

      // Add to recent products in background
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

      // Fetch related products in background
      if (data.category_id) {
        supabase
          .from('products')
          .select('*')
          .eq('category_id', data.category_id)
          .neq('id', data.id)
          .limit(4)
          .then(({ data: related, error: relError }) => {
            if (!relError && related) {
              setRelatedProducts(related)
            }
          })
          .catch(err => {
            console.error('Error fetching related products:', err);
          })
      }

      // Fetch rating summary in background
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'https://molvbriv-frontend.onrender.com';
      fetch(`${API_BASE_URL}/api/reviews/summary/product/${data.id}`)
        .then(res => {
          if (!res.ok) throw new Error(`Status ${res.status}`);
          return res.json();
        })
        .then(sData => {
          if (sData.success) {
            setSummary(sData.summary);
          }
        })
        .catch(err => {
          console.error('Error fetching summary:', err);
        })
    } catch (err) {
      console.error('Error fetching product:', err.message)
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
              <div className="flex items-center gap-1.5 mt-2">
                <div className="flex gap-0.5 text-secondary">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={`material-symbols-outlined text-xs ${summary && star <= Math.round(summary.averageRating) ? 'fill-secondary text-secondary' : 'text-outline-variant/40'}`}>
                      star
                    </span>
                  ))}
                </div>
                <span className="text-xs text-on-surface-variant font-medium">
                  {summary && summary.totalRatings > 0 
                    ? `${summary.averageRating} / 5 (${summary.totalRatings} verified reviews)`
                    : 'No reviews yet'}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-6">
                <span className="text-2xl md:text-3xl font-body text-secondary">₹{(product.price || 0).toLocaleString()}</span>
                {product.compare_price && Number(product.compare_price) > Number(product.price) && (
                  <>
                    <span className="text-lg md:text-xl font-body text-on-surface-variant line-through opacity-60">₹{Number(product.compare_price).toLocaleString()}</span>
                    <span className="text-xs font-bold font-manrope text-secondary bg-secondary/10 px-2.5 py-0.5 rounded-sm tracking-wider uppercase">
                      {Math.round(((Number(product.compare_price) - Number(product.price)) / Number(product.compare_price)) * 100)}% Off
                    </span>
                  </>
                )}
                {product.tags && product.tags.length > 0 && (
                  <span className="px-3 py-1 bg-secondary-container/30 text-on-secondary-container text-[10px] uppercase tracking-widest font-bold">{product.tags[0]}</span>
                )}
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
                  onClick={() => toggleWishlist(product.id, product)} 
                  className={`w-16 flex items-center justify-center border transition-all hover:scale-105 hover:shadow-sm ${wishlist?.includes(product?.id) ? 'border-black bg-red-50' : 'border-outline-variant/30 hover:bg-surface-container-highest'}`}
                  aria-label="Toggle Wishlist"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24"
                    fill={wishlist?.includes(product?.id) ? '#ef4444' : 'none'}
                    stroke={wishlist?.includes(product?.id) ? '#ef4444' : '#000000'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform duration-300 hover:scale-110"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
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

            <div className="mt-8 border-t border-b border-surface-variant/40 divide-y divide-surface-variant/40">
              {/* Product Details Accordion */}
              <div className="py-4">
                <button 
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full flex items-center justify-between py-2 text-left font-manrope text-sm md:text-base tracking-wide text-primary hover:text-secondary transition-all"
                >
                  <span className="font-semibold text-on-surface">Product Details</span>
                  <span className={`material-symbols-outlined text-outline transition-transform duration-300 ${showDetails ? 'rotate-90 text-secondary' : ''}`}>
                    chevron_right
                  </span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${showDetails ? 'max-h-[500px] mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed font-inter font-light">
                    The <span className="font-semibold text-primary">{product.title}</span> is an authentic MOLVBRIV creation, meticulously designed and handcrafted by our master artisans. Utilizing a premium selection of <span className="font-semibold text-primary">{product.material || 'fine materials'}</span>, this piece is individually certified for quality and authenticity to ensure a lifetime of timeless elegance.
                  </p>
                  <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 border-t border-surface-variant/20 pt-5 text-xs font-manrope">
                    <div>
                      <span className="text-outline-variant/80 uppercase tracking-widest text-[9px] font-bold">Product Title</span>
                      <p className="text-primary font-semibold mt-1 text-[11px] md:text-xs">{product.title}</p>
                    </div>
                    <div>
                      <span className="text-outline-variant/80 uppercase tracking-widest text-[9px] font-bold">Material Spec</span>
                      <p className="text-primary font-semibold mt-1 text-[11px] md:text-xs">{product.material || 'Premium Alloy'}</p>
                    </div>
                    <div>
                      <span className="text-outline-variant/80 uppercase tracking-widest text-[9px] font-bold">SKU Code</span>
                      <p className="text-primary font-semibold mt-1 text-[11px] md:text-xs font-mono">{product.sku || product.id?.substring(0, 8).toUpperCase()}</p>
                    </div>
                    <div>
                      <span className="text-outline-variant/80 uppercase tracking-widest text-[9px] font-bold">Availability</span>
                      <p className="text-primary font-semibold mt-1 text-[11px] md:text-xs">{product.stock > 0 ? `${product.stock} Units In Stock` : 'Out of Stock'}</p>
                    </div>
                    {product.colors && product.colors.length > 0 && (
                      <div>
                        <span className="text-outline-variant/80 uppercase tracking-widest text-[9px] font-bold">Color Selection</span>
                        <p className="text-primary font-semibold mt-1 text-[11px] md:text-xs">{product.colors.join(', ')}</p>
                      </div>
                    )}
                    {product.tags && product.tags.length > 0 && (
                      <div>
                        <span className="text-outline-variant/80 uppercase tracking-widest text-[9px] font-bold">Style/Tags</span>
                        <p className="text-primary font-semibold mt-1 text-[11px] md:text-xs">{product.tags.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping & Returns Accordion */}
              <div className="py-4">
                <button 
                  onClick={() => setShowDelivery(!showDelivery)}
                  className="w-full flex items-center justify-between py-2 text-left font-manrope text-sm md:text-base tracking-wide text-primary hover:text-secondary transition-all"
                >
                  <span className="font-semibold text-on-surface">Shipping & Returns</span>
                  <span className={`material-symbols-outlined text-outline transition-transform duration-300 ${showDelivery ? 'rotate-90 text-secondary' : ''}`}>
                    chevron_right
                  </span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${showDelivery ? 'max-h-96 mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed font-inter font-light">
                    Once your order is confirmed, it will be shipped and delivered to your doorstep within 3 to 6 business days. We ensure every product is carefully packed to reach you in perfect condition. If you are not satisfied, you may initiate a hassle-free return within 24 hours of delivery (item must be unused and in original packaging).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Products Bottom Section */}
        <div className="pt-16 md:pt-24 border-t border-surface-variant/20 mt-16 md:mt-24">
          {/* Tab Navigation */}
          <div className="flex items-center justify-start gap-10 md:gap-14 mb-10">
            <button 
              onClick={() => setActiveBottomTab('related')}
              className={`text-xs md:text-sm font-manrope tracking-widest transition-all duration-300 uppercase pb-2.5 ${
                activeBottomTab === 'related' 
                  ? 'text-on-surface border-b-[2px] border-on-surface font-semibold' 
                  : 'text-outline/70 hover:text-on-surface font-semibold'
              }`}
            >
              RELATED PRODUCTS
            </button>
            <button 
              onClick={() => setActiveBottomTab('recent')}
              className={`text-xs md:text-sm font-manrope tracking-widest transition-all duration-300 uppercase pb-2.5 ${
                activeBottomTab === 'recent' 
                  ? 'text-on-surface border-b-[2px] border-on-surface font-semibold' 
                  : 'text-outline/70 hover:text-on-surface font-semibold'
              }`}
            >
              RECENTLY VIEWED
            </button>
          </div>

          {/* Tab Content */}
          {activeBottomTab === 'related' ? (
            relatedProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                {relatedProducts.map(rp => (
                  <Link to={`/product/${rp.id}`} key={rp.id} className="group cursor-pointer">
                    <div className="aspect-[4/5] bg-surface-container-low overflow-hidden rounded-xl mb-4">
                      <img 
                        src={rp.images && rp.images.length > 0 ? rp.images[0] : 'https://images.unsplash.com/photo-1515562141589-67f0d954ca94?w=800&h=900&fit=crop'} 
                        alt={rp.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      />
                    </div>
                    <h3 className="font-manrope text-primary text-sm md:text-base truncate">{rp.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-body text-secondary text-sm">₹{(rp.price || 0).toLocaleString()}</span>
                      {rp.compare_price && Number(rp.compare_price) > Number(rp.price) && (
                        <>
                          <span className="text-xs text-on-surface-variant line-through opacity-60">₹{Number(rp.compare_price).toLocaleString()}</span>
                          <span className="text-[9px] font-bold font-manrope text-secondary bg-secondary/10 px-1.5 py-0.5 rounded-sm">
                            {Math.round(((Number(rp.compare_price) - Number(rp.price)) / Number(rp.compare_price)) * 100)}% OFF
                          </span>
                        </>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-outline text-sm">
                No related products found in this collection.
              </div>
            )
          ) : (
            recentProducts.filter(rp => rp.id !== id).length > 0 ? (
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
                        <>
                          <span className="text-xs text-on-surface-variant line-through opacity-60">₹{Number(rp.compare_price).toLocaleString()}</span>
                          <span className="text-[9px] font-bold font-manrope text-secondary bg-secondary/10 px-1.5 py-0.5 rounded-sm">
                            {Math.round(((Number(rp.compare_price) - Number(rp.price)) / Number(rp.compare_price)) * 100)}% OFF
                          </span>
                        </>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-outline text-sm">
                Your recently viewed jewelry items will appear here.
              </div>
            )
          )}
        </div>

        <ProductReviews productId={id} />
      </main>

      <Footer />
    </div>
  )
}


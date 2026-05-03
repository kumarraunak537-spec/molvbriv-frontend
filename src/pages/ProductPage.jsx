import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useCart } from '../context/CartContext'
import { products } from '../data/products'

export default function ProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [addedToCart, setAddedToCart] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  const product = products.find(p => p.id === id) || products[0]

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      description: 'Crafted from responsibly sourced materials with timeless precision.',
      image: product.image,
    })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const handleBuyNow = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      description: 'Crafted from responsibly sourced materials with timeless precision.',
      image: product.image,
    })
    navigate('/buy-now')
  }

  return (
    <div className="bg-surface font-body text-on-surface antialiased">
      <Navbar />

      <main className="pt-24 md:pt-32 pb-12 md:pb-20 max-w-7xl mx-auto px-5 md:px-12">
        {/* Product Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 mb-16 md:mb-24">
          {/* Product Display (Boutique Slider) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="relative aspect-[4/5] bg-surface-container-low overflow-hidden group">
              <img alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={product.image} />
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-4">
                <button className="w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full text-white border border-white/20 hover:bg-white/20 transition-all">
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <button className="w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full text-white border border-white/20 hover:bg-white/20 transition-all">
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
              {/* Zoom/360 Placeholder Badge */}
              <div className="absolute top-6 right-6">
                <button className="px-4 py-2 bg-white/20 backdrop-blur-lg border border-white/10 text-white text-xs uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">360</span>
                  View 360°
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="aspect-square bg-surface-container-highest border border-outline-variant/10 cursor-pointer overflow-hidden">
                <img alt="Jewelry thumbnail" className="w-full h-full object-cover hover:opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCx5rWez9RJ8Ao5F2fvw7-VW5Rph6TPAwP-Ee81TTKt45ta-JResuYY2XVfKFmqObUbAycDUAprONscjZY-_Ajb9-2UcfYJED_8WFINrcLaOFTZ-nB6eUBywxoTrU310iwPB1J1t5svblkvolkDyQ6oStvX8NqqnGMYlQXzTClpauImrvzGOzlJN1Osu9_OTqvReWLebcWjMgigtSGdeL8EJwkaUu9mS6uTHcVZNLST-MictQ2PzfvI7AwUsZdNXNS8MF7EgH-Cj4w" />
              </div>
              <div className="aspect-square bg-surface-container-highest border border-outline-variant/10 cursor-pointer overflow-hidden">
                <img alt="Jewelry thumbnail" className="w-full h-full object-cover hover:opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZDBnfsFI6se3kQoBEXOxwheavS4huBt2j96_C2OQm4wvwhrdfcz3aUtGnd9k27Ri1tQR_yLhhoC5wYwNQVCs3cq7-IuDJaUQDBRfSoCuBXuFDNTiXUnJEsIuegGVkqn-91BiibN5XtsgKT7zc0mXgcJ2ngtB-mpADJxgvMMg-XKlM04LfVFOdqREmtFc_6_XsV_3_IRqQiXgTTbrxHCu9WBC53fYJdUp9veGA6GL22Mt5LIaFXXP3EpnDAvaPVS46I4ORYsZlD6s" />
              </div>
              <div className="aspect-square bg-surface-container-highest border border-outline-variant/10 cursor-pointer overflow-hidden">
                <img alt="Jewelry thumbnail" className="w-full h-full object-cover hover:opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD6Tjiz1sLu0M9zopwbSVuCg-gnDkTNVVaxNNepayLws858FjZyiQ38Y-ix4eFWADb-LRCRMBz3_jw8BmL7NfhDEZ4AMjNY2YqUIJOpcG0WHQhZmW2GvnEHxiEwE3bDXwRxSKBCqmBjNRmJO_VP6ALuyTtKAORX0rV5LX6CynP3dbCfR2iCnRdr4dWlHkeT2cz7vlPFlXL3bZoARRkWsTr7yPHUEoah9E5A2kjdeHam_b-qSGt70RRlPtMzHlTYOpzUBcsNsK92ZwI" />
              </div>
              <div className="aspect-square bg-surface-container-highest border border-outline-variant/10 cursor-pointer overflow-hidden flex items-center justify-center group">
                <div className="text-center group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-primary text-3xl">play_circle</span>
                  <p className="text-[10px] uppercase tracking-tighter mt-1">Watch Film</p>
                </div>
              </div>
            </div>
          </div>
          {/* Product Info */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="mb-8">
              <span className="text-secondary text-xs uppercase tracking-[0.2em] font-body font-semibold">{product.tag || 'The Eternal Collection'}</span>
              <h1 className="text-3xl md:text-5xl font-manrope text-primary mt-3 md:mt-4 mb-2 leading-tight">{product.name}</h1>
              <div className="flex items-center gap-4 mt-6">
                <span className="text-2xl md:text-3xl font-body text-secondary">₹{product.price.toLocaleString()}.00</span>
                <span className="px-3 py-1 bg-secondary-container/30 text-on-secondary-container text-[10px] uppercase tracking-widest font-bold">Limited Release</span>
              </div>
            </div>
            <div className="space-y-8 mb-10">
              <div className="p-6 bg-surface-container-low border-l-2 border-secondary/20">
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Crafted from responsibly sourced {product.material.replace(/-/g, ' ')}, the {product.name} features exceptional craftsmanship and precision. A testament to quiet luxury and timeless elegance.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-outline mb-1">Material</p>
                  <p className="font-body text-sm font-medium capitalize">{product.material.replace(/-/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-outline mb-1">Carat Weight</p>
                  <p className="font-body text-sm font-medium">1.55ct Total</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-outline mb-1">Clarity</p>
                  <p className="font-body text-sm font-medium">VVS1 - Exceptional</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-outline mb-1">Color Grade</p>
                  <p className="font-body text-sm font-medium">D (Colorless)</p>
                </div>
              </div>
            </div>
            {/* Actions */}
            <div className="space-y-4 mb-12">
              <div className="flex gap-4">
                <button onClick={handleAddToCart} className="flex-1 bg-primary text-on-primary py-5 text-xs uppercase tracking-[0.2em] font-bold hover:bg-primary-container transition-all duration-300 shadow-xl shadow-primary/10">
                  {addedToCart ? 'Added to Cart ✓' : 'Add to Cart'}
                </button>
                <button className="w-16 flex items-center justify-center border border-outline-variant/30 hover:bg-surface-container-highest transition-all">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                </button>
              </div>
              <button onClick={handleBuyNow} className="w-full border border-primary text-primary py-5 text-xs uppercase tracking-[0.2em] font-bold hover:bg-primary hover:text-white transition-all duration-500">
                BUY NOW
              </button>
              <div className="flex justify-between pt-4">
                <button className="text-xs text-on-surface-variant underline underline-offset-4 decoration-secondary/40 hover:text-secondary transition-colors uppercase tracking-widest">
                  Size Guide
                </button>
                <button className="text-xs text-on-surface-variant underline underline-offset-4 decoration-secondary/40 hover:text-secondary transition-colors uppercase tracking-widest">
                  In-Store Availability
                </button>
              </div>
            </div>
            {/* Trust Markers */}
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
        {/* Experience & Journal (Bento) */}
        <section className="mb-16 md:mb-32">
          <h2 className="text-2xl font-manrope text-primary mb-12 text-center">Styling &amp; Provenance</h2>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 h-auto md:h-[600px]">
            <div className="md:col-span-8 relative overflow-hidden bg-surface-container-low p-8 md:p-12 flex flex-col justify-end group min-h-[300px] md:min-h-0">
              <img alt="Styling context" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwUeZA8mdm1H6cnnCHjcwoXMvXsGdI-y1ZqkqVkwx8ajizi1ASgGCuz4HdK4CXPc8uMaX1fTHk-YS84ZYUxvIIpTYWUe_nq74oyzZakmWzTAgHirdbecSinsQ5OXa8xLUKFr5f6Cn2ocwOOFT3J1R218N7_nDXKMFLC-mMr9DZSgFVh-_e2zTlMXdZdoeLJ3YLF3CSfRWXNJ9etyOuc28PGA3wJL2t2Oi_H1Y-PAWAHcOfOjC2GLkiu8QMjzfNo5Zw6DfqVu1PFZk" />
              <div className="relative z-10 max-w-md">
                <span className="text-secondary text-[10px] uppercase tracking-widest mb-4 block">The Curator's Journal</span>
                <h3 className="text-3xl font-manrope text-primary mb-4 italic">The Art of Layering: Gold &amp; Light</h3>
                <p className="text-sm text-on-surface-variant mb-6">Explore how the Seraphina interacts with different necklines and textures in our latest editorial feature.</p>
                <Link to="#" className="text-xs font-bold uppercase tracking-widest border-b border-primary pb-1">Read the entry</Link>
              </div>
            </div>
            <div className="md:col-span-4 bg-[#1F3D2B] p-6 md:p-10 flex flex-col justify-between text-white min-h-[250px] md:min-h-0">
              <div>
                <span className="material-symbols-outlined text-secondary-container text-4xl mb-6">auto_awesome</span>
                <h3 className="text-xl font-manrope mb-4">Certified GIA Excellence</h3>
                <p className="text-sm text-on-primary-container leading-relaxed">Each Molvbriv diamond over 0.5ct is accompanied by a GIA grading report and a digital certificate of origin, recorded on our private blockchain for absolute provenance.</p>
              </div>
              <button className="text-[10px] uppercase tracking-[0.2em] font-bold border border-white/20 py-4 hover:bg-white/10 transition-colors">
                View Certificate Specimen
              </button>
            </div>
          </div>
        </section>
        {/* Customer Experience (Reviews) */}
        <section className="mb-16 md:mb-32">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-manrope text-primary">Voices of Molvbriv</h2>
              <p className="text-on-surface-variant text-sm mt-2">Personal reflections from our community.</p>
            </div>
            <div className="flex items-center gap-1 mt-4 md:mt-0">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="text-xs font-bold ml-2">4.9 / 5.0</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="p-8 bg-surface-container-low/50 backdrop-blur-sm border border-white/40 shadow-sm flex flex-col justify-between h-64">
              <p className="italic text-on-surface-variant text-sm leading-relaxed">"The way the champagne gold catches the evening light is unlike anything I've owned. It's substantial yet feels weightless."</p>
              <div className="mt-8">
                <p className="text-[10px] uppercase tracking-widest font-bold">Eleanor V.</p>
                <p className="text-[9px] text-outline uppercase tracking-tighter">Verified Curator • London</p>
              </div>
            </div>
            <div className="p-8 bg-surface-container-low/50 backdrop-blur-sm border border-white/40 shadow-sm flex flex-col justify-between h-64">
              <p className="italic text-on-surface-variant text-sm leading-relaxed">"The bespoke service was impeccable. Molvbriv truly understands the nuances of modern luxury and heritage craftsmanship."</p>
              <div className="mt-8">
                <p className="text-[10px] uppercase tracking-widest font-bold">James T.</p>
                <p className="text-[9px] text-outline uppercase tracking-tighter">Verified Curator • Paris</p>
              </div>
            </div>
            <div className="p-8 bg-surface-container-low/50 backdrop-blur-sm border border-white/40 shadow-sm flex flex-col justify-between h-64">
              <p className="italic text-on-surface-variant text-sm leading-relaxed">"A masterpiece. The Seraphina is my daily companion now. Subtle enough for the office, brilliant enough for the gala."</p>
              <div className="mt-8">
                <p className="text-[10px] uppercase tracking-widest font-bold">Sophia K.</p>
                <p className="text-[9px] text-outline uppercase tracking-tighter">Verified Curator • New York</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}

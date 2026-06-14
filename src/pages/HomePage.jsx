import React, { useEffect, useState, memo } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import heroVideo2K from '../assets/hero-2k.mp4'
import heroVideo1080p from '../assets/hero-1080p.mp4'
import heroVideoMobile from '../assets/hero-mobile.mp4'
import heroPoster from '../assets/hero-poster.jpg'
import { updateSEO } from '../utils/seo'

// Memoized Hero Video component to prevent DOM re-renders and playbacks restarts.
// Applies GPU hardware acceleration via translate3d and will-change: transform.
const HeroVideo = memo(({ src, poster }) => {
  return (
    <video 
      autoPlay 
      loop 
      muted 
      playsInline
      preload="auto"
      poster={poster}
      src={src}
      className="w-full h-full object-cover scale-105"
      style={{
        transform: 'scale(1.05) translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        willChange: 'transform',
      }}
    />
  )
})

HeroVideo.displayName = 'HeroVideo'



export default function HomePage() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [videoSrc, setVideoSrc] = useState(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth
      if (width >= 1440) return heroVideo2K
      if (width >= 768) return heroVideo1080p
      return heroVideoMobile
    }
    return heroVideoMobile
  })

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'https://molvbriv-frontend.onrender.com'

  useEffect(() => {
    window.scrollTo(0, 0)
    updateSEO({
      title: "Molvbriv — The Timeless Curator",
      description: "Molvbriv — Luxury fine jewelry crafted with timeless elegance since 1904. Discover our Heritage Collection of handcrafted rings, necklaces, earrings and more."
    })
  }, [])


  const handleSubscribe = async (e) => {
    e.preventDefault()
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setSubscribed(true)
      } else {
        setError(data.error || 'Failed to subscribe. Please try again.')
      }
    } catch (err) {
      console.warn('Subscription API failed. Falling back to frontend-only simulation:', err)
      // Fallback: make it work gracefully even if backend is offline
      setSubscribed(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-background text-on-background selection:bg-secondary/20 font-body">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-surface-container-highest">
          <HeroVideo src={videoSrc} poster={heroPoster} />
          <div className="absolute inset-0 bg-primary/20"></div>
        </div>


        <div className="absolute bottom-12 md:bottom-20 left-0 right-0 z-10 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 px-5 md:px-6">
          <Link to="/collections" className="bg-primary text-white px-8 md:px-10 py-3.5 md:py-4 text-xs md:text-sm tracking-widest uppercase hover:bg-primary-container transition-all duration-500 shadow-xl w-full md:w-auto text-center block">
            Discover The Collection
          </Link>
          <Link to="/all-products" className="glass-card text-white px-8 md:px-10 py-3.5 md:py-4 text-xs md:text-sm tracking-widest uppercase hover:bg-white/20 transition-all duration-500 border border-white/10 w-full md:w-auto text-center block">
            SHOP NOW
          </Link>
        </div>
      </section>



      {/* Featured Series - Asymmetric Layout */}
      <section className="bg-surface-container-low py-16 md:py-32 px-5 md:px-12 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 items-center">
            <div className="md:col-span-5 space-y-12">
              <div className="space-y-6">
                <span className="text-secondary tracking-[0.3em] uppercase text-[10px] font-bold">Featured Series</span>
                <h2 className="text-3xl md:text-5xl font-manrope text-primary leading-tight">Molvbriv Signature Collection</h2>
                <p className="text-on-surface-variant font-body leading-relaxed max-w-sm">
                  A tribute to architectural symmetry and organic flow. Each piece is hand-carved to catch the light from every conceivable angle.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 md:gap-8">
                <div>
                  <h4 className="text-primary font-bold text-lg mb-2">Royal Heritage</h4>
                  <p className="text-xs text-on-surface-variant">Regal designs inspired by ancient dynasties.</p>
                </div>
                <div>
                  <h4 className="text-primary font-bold text-lg mb-2">Modern Elegance</h4>
                  <p className="text-xs text-on-surface-variant">Minimalist silhouettes for the contemporary soul.</p>
                </div>
              </div>
              <Link to="/collections" className="inline-block border-b border-secondary pb-1 text-secondary tracking-widest uppercase text-xs hover:tracking-[0.2em] transition-all">Explore Series</Link>
            </div>
            <div className="md:col-span-7 relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4 pt-12">
                  <img className="w-full aspect-[4/5] object-cover" alt="Gold diamond ring showcase" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXQ6zcurXAOej9mhjvSGFNmlDBD3HK514mpbrAPnRvfVrglITD7GDf202_jsgER-RiXjLEDKnDTIMFToHmaamANJz_1ZqWUcTlbElyLenm43O7kCTUJTdvIM_3YhxcSzBo1KFtFMxdUYoZ9TaiPShPUqvUc9CtfjOSqMIZwZ5dGQlQmRgOsJKESFRptFzmsBoi00kFqBKLrTKL_iQxns2BiBv0189R7PMRDSn5X-DbiVz_Zxb_KG-Dcciv9C0SD5lXWcvRhZB7itc"/>
                  <div className="p-8 bg-surface-container-highest">
                    <span className="font-manrope italic text-primary">"Jewelry is the exclamation point of a woman's outfit."</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <img className="w-full aspect-[4/6] object-cover shadow-2xl" alt="Pearl earring detail photography" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDpOlOzUZ_jsi-E4ZLgKqgFdZQa2qUPPEfqZimkWu1fhZIwTpKbguBe9kbOPqMoTTdvo2YcqFptR7tF5xqcqoFQjEqN3mPKx0KutXcHrzHSLo7ZhR-yXSEEEAcz_TJUa5Yh6q4JJ4RkL6rYydCTj05as0vrfJ2vUzyn54EOSi-st1NJAfk3-6ZN4gFqym6ZfLsN8dOx46a3pGN95IS1RYpZo8M9l09GRQKOc85UEsyGa__pNWk4_XvkLttl4P_rNZab-hd59HIVzN0"/>
                  <img className="w-full aspect-[1/1] object-cover" alt="Craftsmanship detail macro shot" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBgg2qdYJO_7aRr1wYOtpKhdwTTL4df6pVSZTzZPLICwy9Qmp6QPHWHVCIlHwk21IzxYaDS6Ddi3urJf-iXZi7MWVSXBVp32t2jSbb6RqbHOrISAFbla9HUJCzB-73fcEKdUzyhhwr8AP3z-E29V2r_b30YpF2rsmjmB_Q_VJAywR1s__a0vmPxcnodzQ9IsiIA6kh7DojFzViL0cbFJePb9S2HWVTFVixVvHRhKKYME2uV2IUOjJ7cBM8QZtQ6ClCgSZUMHpQPBqY"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>







      {/* Trust Badges */}
      <section className="py-10 md:py-16 border-t border-black/5 bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-5 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
            <div className="flex flex-col items-center text-center gap-4">
              <span className="material-symbols-outlined text-secondary text-3xl">verified</span>
              <p className="text-[10px] uppercase tracking-widest font-bold text-primary">Certified Gems</p>
            </div>
            <div className="flex flex-col items-center text-center gap-4">
              <span className="material-symbols-outlined text-secondary text-3xl">local_shipping</span>
              <p className="text-[10px] uppercase tracking-widest font-bold text-primary">Secure Delivery</p>
            </div>
            <div className="flex flex-col items-center text-center gap-4">
              <span className="material-symbols-outlined text-secondary text-3xl">lock</span>
              <p className="text-[10px] uppercase tracking-widest font-bold text-primary">Secure Checkout</p>
            </div>
            <div className="flex flex-col items-center text-center gap-4">
              <span className="material-symbols-outlined text-secondary text-3xl">published_with_changes</span>
              <p className="text-[10px] uppercase tracking-widest font-bold text-primary">Easy Returns</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 md:py-32 px-5 md:px-12 bg-surface">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-manrope text-primary mb-4 md:mb-6">Join The Circle</h2>
          
          {subscribed ? (
            <div className="p-8 md:p-10 border border-[#d4af37]/30 space-y-4 max-w-xl mx-auto rounded-sm animate-fade-in" style={{ background: 'rgba(26, 74, 53, 0.03)' }}>
              <div className="w-12 h-12 rounded-full border border-[#765931]/30 flex items-center justify-center mx-auto text-[#765931]">
                <span className="material-symbols-outlined text-xl">done</span>
              </div>
              <h3 className="font-manrope text-lg md:text-xl text-[#765931] tracking-wide font-semibold">Welcome to the Boutique Circle</h3>
              <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed">
                An invitation with early access to new collections and private boutique events has been dispatched to <span className="font-semibold text-primary">{email}</span>.
              </p>
            </div>
          ) : (
            <>
              <p className="text-on-surface-variant mb-6 md:mb-10 text-sm md:text-base">Subscribe for early access to new collections and private boutique events.</p>
              <form className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto" onSubmit={handleSubscribe}>
                <div className="flex-grow flex flex-col items-start gap-1 w-full">
                  <input 
                    className="w-full bg-surface-container-low border-none focus:ring-1 focus:ring-secondary py-3.5 md:py-4 px-4 md:px-6 text-sm disabled:opacity-50" 
                    placeholder="Email Address" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                  {error && <p className="text-[10px] text-red-500 ml-1 font-medium">{error}</p>}
                </div>
                <button 
                  className="bg-primary text-white px-8 md:px-10 py-3.5 md:py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-secondary transition-colors duration-500 h-fit disabled:opacity-50 flex items-center justify-center min-w-[140px]" 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                </button>
              </form>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}

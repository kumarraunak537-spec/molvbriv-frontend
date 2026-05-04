import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function HomePage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="bg-background text-on-background selection:bg-secondary/20 font-body">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover scale-105">
            <source src="/video.mp4" type="video/mp4" />
          </video>
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
              <button className="border-b border-secondary pb-1 text-secondary tracking-widest uppercase text-xs hover:tracking-[0.2em] transition-all">Explore Series</button>
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
              <p className="text-[10px] uppercase tracking-widest font-bold text-primary">Insured Checkout</p>
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
          <p className="text-on-surface-variant mb-6 md:mb-10 text-sm md:text-base">Subscribe for early access to new collections and private boutique events.</p>
          <form className="flex flex-col md:flex-row gap-4" onSubmit={(e) => e.preventDefault()}>
            <input className="flex-grow bg-surface-container-low border-none focus:ring-1 focus:ring-secondary py-3.5 md:py-4 px-4 md:px-6 text-sm" placeholder="Email Address" type="email"/>
            <button className="bg-primary text-white px-8 md:px-10 py-3.5 md:py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-secondary transition-colors duration-500" type="submit">Subscribe</button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  )
}

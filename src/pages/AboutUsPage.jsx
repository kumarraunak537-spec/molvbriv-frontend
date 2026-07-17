import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { updateSEO } from '../utils/seo'

export default function AboutUsPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
    updateSEO({
      title: "About Our Heritage — Molvbriv",
      description: "Discover the history, design philosophy, and craftsmanship behind Molvbriv fine jewelry. Crafting quiet luxury and timeless masterpieces since 1904.",
      schema: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "About Our Heritage — Molvbriv",
        "description": "Discover the history, design philosophy, and craftsmanship behind Molvbriv fine jewelry. Crafting quiet luxury and timeless masterpieces since 1904.",
        "url": window.location.origin + "/about"
      }
    })
  }, [])

  return (
    <div className="bg-background text-on-background selection:bg-secondary/20 font-body">
      <Navbar />



      {/* Craftsmanship Section */}
      <section className="bg-surface-container-low pt-32 pb-20 md:pt-40 md:pb-32 px-5 md:px-12 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div className="relative group overflow-hidden bg-surface-container-highest">
              <img 
                src="/images/about/media__1777835393246.jpg" 
                alt="Intricate Craftsmanship of Jhumkas" 
                className="w-full aspect-square md:aspect-[4/5] object-cover hover:scale-105 transition-transform duration-1000"
              />
            </div>
            <div className="space-y-8 md:pl-10">
              <span className="text-secondary tracking-[0.3em] uppercase text-[10px] font-bold block">The Craft</span>
              <h2 className="text-3xl md:text-5xl font-manrope text-primary leading-tight">Uncompromising Precision</h2>
              <div className="space-y-6 text-on-surface-variant font-body leading-relaxed text-sm md:text-base">
                <p>
                  Our Jhumkas are born from a deep respect for artisanal traditions. Notice the delicate floral motifs and the meticulous placement of vibrant teal stones, reflecting hours of dedicated craftsmanship.
                </p>
                <p>
                  The classic bell shape is elevated with detailed texturing, delicate beaded fringes, and a symphony of gold and colorful accents. Each earring is designed not just as an accessory, but as a wearable piece of art.
                </p>
              </div>
              <div className="pt-4">
                <Link to="/collections" className="inline-block border-b border-primary pb-1 text-primary tracking-widest uppercase text-xs font-bold hover:tracking-[0.2em] hover:text-secondary hover:border-secondary transition-all">
                  Discover The Process
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Vision Section */}
      <section className="bg-primary py-24 md:py-40 px-5 md:px-12 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10">
          <img 
            src="/images/about/media__1777835401494.jpg" 
            alt="Macro Texture of Red Jhumka" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="material-symbols-outlined text-secondary text-5xl mb-8">diamond</span>
          <h2 className="text-3xl md:text-5xl font-manrope mb-8 leading-tight">
            "We do not merely set stones. We architect monuments to light."
          </h2>
          <p className="text-secondary font-manrope tracking-widest uppercase text-xs">
            — The Founder's Vision
          </p>
        </div>
      </section>

      {/* Lifestyle & Elegance Section */}
      <section className="bg-surface py-20 md:py-32 px-5 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div className="space-y-8 order-2 md:order-1 md:pr-10">
              <span className="text-secondary tracking-[0.3em] uppercase text-[10px] font-bold block">The Molvbriv Experience</span>
              <h2 className="text-3xl md:text-5xl font-manrope text-primary leading-tight">Quiet Luxury, Amplified</h2>
              <div className="space-y-6 text-on-surface-variant font-body leading-relaxed text-sm md:text-base">
                <p>
                  Whether it is the vibrant charm of multi-colored gems or the timeless grace of classic silver, our collection is curated for the modern woman who embraces her roots with pride. 
                </p>
                <p>
                  From festive gatherings to everyday celebrations, these pieces effortlessly blend traditional aesthetics with contemporary grace. It's the gentle sway of the Jhumka that truly captures the spirit of femininity.
                </p>
              </div>
            </div>
            <div className="relative group overflow-hidden order-1 md:order-2 bg-surface-container-highest">
              <img 
                src="/images/about/media__1777835386766.jpg" 
                alt="Modern Traditional Lifestyle" 
                className="w-full aspect-square md:aspect-[4/5] object-cover hover:scale-105 transition-transform duration-1000"
              />
            </div>
          </div>
        </div>
      </section>



      {/* Our Signature Jhumka Collection */}
      <section className="bg-surface py-20 md:py-32 px-5 md:px-12 border-t border-surface-variant">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 md:mb-32">
            <span className="text-secondary tracking-[0.3em] uppercase text-[10px] md:text-xs font-bold mb-4 block">The Masterpieces</span>
            <h2 className="text-3xl md:text-5xl font-manrope text-primary leading-tight">
              Our Signature Jhumka Collection
            </h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto mt-6 text-sm md:text-base leading-relaxed">
              Every Jhumka tells a story of heritage, passion, and unparalleled artistry. Explore the intricate details and design philosophies behind our most celebrated models.
            </p>
          </div>

          <div className="space-y-24 md:space-y-32">
            {/* Jhumka Model 1 - Image Left, Text Right */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
              <div className="relative overflow-hidden bg-surface-container-highest group">
                <img 
                  src="/images/about/media__1777836171760.jpg" 
                  alt="Silver and Turquoise Jhumkas" 
                  className="w-full aspect-[4/5] md:aspect-square object-cover hover:scale-105 transition-transform duration-1000"
                />
              </div>
              <div className="space-y-6">
                <span className="text-secondary tracking-[0.2em] uppercase text-[10px] font-bold block">01 / Masterpiece</span>
                <h3 className="text-3xl md:text-4xl font-manrope text-primary">The Azure Ripple Jhumka</h3>
                <p className="text-on-surface-variant leading-relaxed text-sm md:text-base">
                  A breathtaking masterpiece crafted in antique silver, featuring a large floral sunburst top and a classic bell dome. Both elements are intricately studded with vibrant turquoise stones. This piece embodies fluidity and traditional grace, finished with a beautiful fringe of delicate azure beads.
                </p>
              </div>
            </div>

            {/* Jhumka Model 2 - Text Left, Image Right */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
              <div className="order-2 md:order-1 space-y-6">
                <span className="text-secondary tracking-[0.2em] uppercase text-[10px] font-bold block">02 / Masterpiece</span>
                <h3 className="text-3xl md:text-4xl font-manrope text-primary">The Crimson Royalty Bridal Jhumka</h3>
                <p className="text-on-surface-variant leading-relaxed text-sm md:text-base">
                  Redefining regal elegance, this model features a grand circular top and a sweeping traditional bell, enriched with deep red enamel and gold detailing. It is meticulously designed to perfectly complement traditional bridal ensembles and floral hair adornments.
                </p>
              </div>
              <div className="relative overflow-hidden bg-surface-container-highest group order-1 md:order-2">
                <img 
                  src="/images/about/media__1777836182696.jpg" 
                  alt="Bridal Red and Gold Jhumka" 
                  className="w-full aspect-[4/5] md:aspect-square object-cover hover:scale-105 transition-transform duration-1000"
                />
              </div>
            </div>

            {/* Jhumka Model 3 - Image Left, Text Right */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
              <div className="relative overflow-hidden bg-surface-container-highest group">
                <img 
                  src="/images/about/media__1777836196080.jpg" 
                  alt="Square Teal Drop Jhumka" 
                  className="w-full aspect-[4/5] md:aspect-square object-cover hover:scale-105 transition-transform duration-1000"
                />
              </div>
              <div className="space-y-6">
                <span className="text-secondary tracking-[0.2em] uppercase text-[10px] font-bold block">03 / Masterpiece</span>
                <h3 className="text-3xl md:text-4xl font-manrope text-primary">The Nawabi Square Drop</h3>
                <p className="text-on-surface-variant leading-relaxed text-sm md:text-base">
                  A modern twist on traditional geometry. This jhumka features a striking diamond-shaped top with a central floral motif. The beautifully textured dome and the vibrant cascade of teal stones create an eye-catching contrast that perfectly balances everyday sophistication with heritage aesthetics.
                </p>
              </div>
            </div>

            {/* Jhumka Model 4 - Text Left, Image Right */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
              <div className="order-2 md:order-1 space-y-6">
                <span className="text-secondary tracking-[0.2em] uppercase text-[10px] font-bold block">04 / Masterpiece</span>
                <h3 className="text-3xl md:text-4xl font-manrope text-primary">The Gulabi Meenakari Classic</h3>
                <p className="text-on-surface-variant leading-relaxed text-sm md:text-base">
                  An exquisite artisanal treasure featuring impeccable gold beadwork and traditional red meenakari (enameling) patterns. The concentric circles and the intricate textured dots capture the essence of romance and grand celebrations, making it a true centerpiece of our collection.
                </p>
              </div>
              <div className="relative overflow-hidden bg-surface-container-highest group order-1 md:order-2">
                <img 
                  src="/images/about/media__1777836204766.jpg" 
                  alt="Red Meenakari Golden Jhumka" 
                  className="w-full aspect-[4/5] md:aspect-square object-cover hover:scale-105 transition-transform duration-1000"
                />
              </div>
            </div>

            {/* Jhumka Model 5 (New!) - Image Left, Text Right */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
              <div className="relative overflow-hidden bg-surface-container-highest group">
                <img 
                  src="/images/about/media__1777836730752.jpg" 
                  alt="Multicolor Pearl Drop Silver Jhumka" 
                  className="w-full aspect-[4/5] md:aspect-square object-cover hover:scale-105 transition-transform duration-1000"
                />
              </div>
              <div className="space-y-6">
                <span className="text-secondary tracking-[0.2em] uppercase text-[10px] font-bold block">05 / Masterpiece</span>
                <h3 className="text-3xl md:text-4xl font-manrope text-primary">The Rainbow Pearl Drop</h3>
                <p className="text-on-surface-variant leading-relaxed text-sm md:text-base">
                  A stunning oxidized silver jhumka adorned with a dazzling spectrum of multi-colored stones, finished with an elegant trim of miniature pearls. Set against striking dark contrasts, this design highlights a perfect blend of festive vibrancy and sophisticated modern allure.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 px-5 text-center bg-surface border-t border-surface-variant">
        <h2 className="text-3xl font-manrope text-primary mb-6">Experience the Collection</h2>
        <p className="text-on-surface-variant mb-10 max-w-md mx-auto text-sm md:text-base">Explore our curated selections and discover the piece that speaks to your legacy.</p>
        <Link to="/all-products" className="inline-block bg-primary text-white px-10 py-4 text-xs tracking-widest uppercase font-bold hover:bg-primary-container transition-all shadow-lg hover:shadow-xl">
          Shop All Jewelry
        </Link>
      </section>

      <Footer />
    </div>
  )
}

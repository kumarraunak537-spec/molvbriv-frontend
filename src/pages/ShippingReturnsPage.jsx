import React, { useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function ShippingReturnsPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="bg-[#fdf9f3] text-[#1c1c18] font-body min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-20 md:pt-40 md:pb-32 px-5 md:px-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16 md:mb-24">
            <span className="text-[#765931] tracking-[0.3em] uppercase text-[10px] md:text-xs font-bold mb-4 block">POLICIES</span>
            <h1 className="text-3xl md:text-5xl font-manrope text-[#082717] leading-tight uppercase tracking-wide">
              Shipping & Returns
            </h1>
            <div className="w-16 h-[1.5px] bg-[#765931]/40 mx-auto mt-6"></div>
          </div>

          {/* Content Sections */}
          <div className="space-y-12 md:space-y-16">
            
            {/* Intro / Commitment */}
            <div className="bg-[#f7f3ed] p-8 md:p-12 border-l-2 border-[#765931]/30">
              <p className="text-[#424843] text-sm md:text-base leading-relaxed font-manrope">
                "At Molvbriv, we are committed to delivering your orders safely and on time. Once your order is confirmed, it will be shipped and delivered to your doorstep within 3 to 6 business days, depending on your location. We ensure every product is carefully packed to reach you in perfect condition."
              </p>
            </div>

            {/* Detailed Policies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 pt-4">
              
              {/* Shipping Policy */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#765931] text-2xl">local_shipping</span>
                  <h2 className="text-lg md:text-xl font-manrope text-[#082717] font-semibold">Safe & Timely Shipping</h2>
                </div>
                <div className="w-full h-[1px] bg-[#e6e2dc]"></div>
                <p className="text-xs md:text-sm text-[#424843] leading-relaxed">
                  Every Molvbriv creation is handled with the utmost discretion and care. Our packages are secure, insulated, and protected to ensure they arrive at your doorstep in absolutely pristine, showroom-perfect condition. 
                </p>
                <p className="text-xs md:text-sm text-[#424843] leading-relaxed font-semibold text-[#765931]">
                  Delivery Timeframe: 3 to 6 business days.
                </p>
              </div>

              {/* Return Policy */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#765931] text-2xl">published_with_changes</span>
                  <h2 className="text-lg md:text-xl font-manrope text-[#082717] font-semibold">Hassle-Free Returns</h2>
                </div>
                <div className="w-full h-[1px] bg-[#e6e2dc]"></div>
                <p className="text-xs md:text-sm text-[#424843] leading-relaxed">
                  If you are not completely satisfied with your purchase, we offer a hassle-free return policy. You may initiate a return request within 24 hours of receiving your product. 
                </p>
                <p className="text-xs md:text-sm text-[#424843] leading-relaxed font-semibold text-[#765931]">
                  Condition: Items must be unused, unaltered, and kept in their original luxury packaging to qualify.
                </p>
              </div>

            </div>

            {/* Support section */}
            <div className="pt-8 border-t border-[#e6e2dc] text-center space-y-6">
              <span className="material-symbols-outlined text-[#765931] text-3xl">support_agent</span>
              <h3 className="text-xl font-manrope text-[#082717] font-semibold">Have Questions?</h3>
              <p className="text-xs md:text-sm text-[#424843] max-w-xl mx-auto leading-relaxed">
                For any shipping or return-related queries, feel free to contact the Molvbriv customer support team — we're always happy to help!
              </p>
              <div className="flex justify-center gap-6 pt-2">
                <a 
                  href="mailto:molvbriv@gmail.com" 
                  className="inline-flex items-center gap-2 px-5 py-3 border border-[#082717] text-[#082717] text-[10px] font-bold uppercase tracking-widest hover:bg-[#082717] hover:text-white transition-all duration-300"
                >
                  <span className="material-symbols-outlined text-sm">mail</span> Email Us
                </a>
                <a 
                  href="tel:8287203901" 
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#082717] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#1f3d2b] transition-all duration-300 shadow-md"
                >
                  <span className="material-symbols-outlined text-sm">call</span> Call 8287203901
                </a>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

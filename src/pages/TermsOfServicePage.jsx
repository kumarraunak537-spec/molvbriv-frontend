import React, { useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { updateSEO } from '../utils/seo'

export default function TermsOfServicePage() {
  useEffect(() => {
    window.scrollTo(0, 0)
    updateSEO({
      title: "Terms of Service — Molvbriv",
      description: "Read the Terms of Service for Molvbriv to understand the usage terms, rules, and purchasing conditions."
    })
  }, [])

  return (
    <div className="bg-[#fdf9f3] text-[#1c1c18] font-body min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-20 md:pt-40 md:pb-32 px-5 md:px-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16 md:mb-24">
            <span className="text-[#765931] tracking-[0.3em] uppercase text-[10px] md:text-xs font-bold mb-4 block">LEGAL</span>
            <h1 className="text-3xl md:text-5xl font-manrope text-[#082717] leading-tight uppercase tracking-wide">
              Terms of Service
            </h1>
            <div className="w-16 h-[1.5px] bg-[#765931]/40 mx-auto mt-6"></div>
          </div>

          {/* Content */}
          <div className="space-y-8 md:space-y-12 text-[#424843] text-sm md:text-base leading-relaxed">
            
            {/* Introduction */}
            <div className="bg-[#f7f3ed] p-8 md:p-12 border-l-2 border-[#765931]/30">
              <h2 className="text-[#082717] font-manrope font-semibold text-lg md:text-xl mb-4">Welcome to Molvbriv</h2>
              <p className="font-manrope text-sm leading-relaxed">
                By accessing or using our website, you agree to comply with and be bound by the following terms and conditions. Please read them carefully before making any purchase.
              </p>
            </div>

            {/* Terms List */}
            <div className="space-y-8 pt-4">
              
              {/* Product Availability & Pricing */}
              <div className="space-y-3">
                <h3 className="text-base md:text-lg font-manrope text-[#082717] font-semibold">1. Product Availability & Pricing</h3>
                <p className="text-xs md:text-sm">
                  All products listed on Molvbriv are subject to availability. We reserve the right to modify, update, or discontinue any product or service at any time without prior notice. Prices are subject to change without notice.
                </p>
              </div>

              {/* Order Information & Accuracy */}
              <div className="space-y-3">
                <h3 className="text-base md:text-lg font-manrope text-[#082717] font-semibold">2. Order Information & Accuracy</h3>
                <p className="text-xs md:text-sm">
                  By placing an order on our website, you confirm that all information provided by you is accurate and complete. Molvbriv is not responsible for any delays or failed deliveries caused due to incorrect information provided by the customer.
                </p>
              </div>

              {/* Intellectual Property */}
              <div className="space-y-3">
                <h3 className="text-base md:text-lg font-manrope text-[#082717] font-semibold">3. Intellectual Property</h3>
                <p className="text-xs md:text-sm">
                  All content on this website, including images, logos, and text, is the intellectual property of Molvbriv and may not be copied, reproduced, or used without prior written permission.
                </p>
              </div>

              {/* Service Termination */}
              <div className="space-y-3">
                <h3 className="text-base md:text-lg font-manrope text-[#082717] font-semibold">4. Service Termination</h3>
                <p className="text-xs md:text-sm">
                  Molvbriv reserves the right to refuse service, cancel orders, or terminate accounts at its sole discretion in case of any violation of these terms.
                </p>
              </div>

              {/* Agreement */}
              <div className="space-y-3">
                <h3 className="text-base md:text-lg font-manrope text-[#082717] font-semibold">5. Acknowledgment</h3>
                <p className="text-xs md:text-sm">
                  By continuing to use our website, you acknowledge that you have read, understood, and agreed to these Terms of Service.
                </p>
              </div>

            </div>

            {/* Support section */}
            <div className="pt-8 border-t border-[#e6e2dc] text-center space-y-6">
              <span className="material-symbols-outlined text-[#765931] text-3xl">gavel</span>
              <h3 className="text-lg md:text-xl font-manrope text-[#082717] font-semibold font-semibold">Questions or Concerns?</h3>
              <p className="text-xs md:text-sm text-[#424843] max-w-xl mx-auto leading-relaxed">
                For any questions or concerns regarding our terms, please reach out to our support team at:
              </p>
              <div className="flex justify-center gap-6 pt-2">
                <a 
                  href="mailto:molvbriv@gmail.com" 
                  className="inline-flex items-center gap-2 px-5 py-3 border border-[#082717] text-[#082717] text-[10px] font-bold uppercase tracking-widest hover:bg-[#082717] hover:text-white transition-all duration-300"
                >
                  <span className="material-symbols-outlined text-sm">mail</span> molvbriv@gmail.com
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

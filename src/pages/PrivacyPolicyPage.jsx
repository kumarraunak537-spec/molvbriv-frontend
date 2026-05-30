import React, { useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function PrivacyPolicyPage() {
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
            <span className="text-[#765931] tracking-[0.3em] uppercase text-[10px] md:text-xs font-bold mb-4 block">LEGAL</span>
            <h1 className="text-3xl md:text-5xl font-manrope text-[#082717] leading-tight uppercase tracking-wide">
              Privacy Policy
            </h1>
            <div className="w-16 h-[1.5px] bg-[#765931]/40 mx-auto mt-6"></div>
          </div>

          {/* Content */}
          <div className="space-y-8 md:space-y-12 text-[#424843] text-sm md:text-base leading-relaxed">
            
            {/* Introduction / Highlight */}
            <div className="bg-[#f7f3ed] p-8 md:p-12 border-l-2 border-[#765931]/30">
              <h2 className="text-[#082717] font-manrope font-semibold text-lg md:text-xl mb-4">Our Commitment to Privacy</h2>
              <p className="font-manrope text-sm leading-relaxed">
                At Molvbriv, your privacy is our top priority. We collect basic personal information such as your name, email address, phone number, shipping address, and payment details when you place an order or register on our website. This information is used solely to process and deliver your orders, send you order updates, and improve our overall services.
              </p>
            </div>

            {/* Privacy Policy Bullet points */}
            <div className="space-y-8 pt-4">
              
              {/* Information Sharing & Security */}
              <div className="space-y-3">
                <h3 className="text-base md:text-lg font-manrope text-[#082717] font-semibold">1. Information Sharing & Security</h3>
                <p className="text-xs md:text-sm">
                  We do not sell, trade, or share your personal information with any third parties, except where necessary to fulfill your order, such as sharing your address with our delivery partners. All your data is stored securely and protected from unauthorized access using encryption and other security measures.
                </p>
              </div>

              {/* Cookies & Third-Party Links */}
              <div className="space-y-3">
                <h3 className="text-base md:text-lg font-manrope text-[#082717] font-semibold">2. Cookies & Third-Party Links</h3>
                <p className="text-xs md:text-sm">
                  Our website may use cookies to improve your browsing experience. You may disable cookies through your browser settings, however some features of the website may not function properly as a result. Molvbriv is not responsible for the privacy practices of any third-party websites that may be linked on our platform.
                </p>
              </div>

              {/* Children's Privacy & Policy Updates */}
              <div className="space-y-3">
                <h3 className="text-base md:text-lg font-manrope text-[#082717] font-semibold">3. Children's Privacy & Policy Updates</h3>
                <p className="text-xs md:text-sm">
                  We do not knowingly collect personal information from children under the age of 13. Molvbriv reserves the right to update this Privacy Policy at any time, and continued use of our website implies your acceptance of any such changes.
                </p>
              </div>

            </div>

            {/* Support section */}
            <div className="pt-8 border-t border-[#e6e2dc] text-center space-y-6">
              <span className="material-symbols-outlined text-[#765931] text-3xl">security</span>
              <h3 className="text-lg md:text-xl font-manrope text-[#082717] font-semibold">Have Questions?</h3>
              <p className="text-xs md:text-sm text-[#424843] max-w-xl mx-auto leading-relaxed">
                If you have any questions or concerns regarding your privacy, please feel free to contact our Molvbriv customer support team — we are always here to help!
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

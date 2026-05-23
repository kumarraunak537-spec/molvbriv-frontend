import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function PaymentFailedPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const error = location.state?.error;
  const checkoutDetails = location.state?.checkoutDetails;

  const handleRetry = () => {
    // Navigate back to checkout (cart page) preserving current customer details for effortless retry
    navigate('/cart', { state: { retryCheckout: true, checkoutDetails } });
  };

  return (
    <div className="bg-background font-body text-on-surface min-h-screen antialiased flex flex-col selection:bg-secondary-container">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center pt-32 pb-24 px-6 md:px-16 max-w-7xl mx-auto w-full">
        <div 
          className="max-w-[620px] w-full text-center space-y-8 glass-card p-8 md:p-12 shadow-sm border border-outline-variant/20 rounded-lg" 
          style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' }}
        >
          {/* Animated Failure Icon */}
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-600">
            <svg 
              className="w-10 h-10 stroke-current text-red-600" 
              viewBox="0 0 24 24" 
              fill="none" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>

          <div className="space-y-3">
            <span className="font-label uppercase tracking-widest text-[10px] text-red-500 font-bold">Transaction Unverified</span>
            <h1 className="font-headline text-4xl md:text-5xl text-primary font-bold tracking-tight">Payment Unsuccessful</h1>
            <p className="text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
              We couldn't verify your luxury payment signature or the window was closed before completion. Rest assured, your selection remains safe in your cart.
            </p>
          </div>

          {/* Error Message Details */}
          <div className="bg-red-50/50 p-6 rounded-sm text-left space-y-3 my-8 border border-red-500/10">
            <h3 className="font-label text-xs uppercase tracking-widest text-red-800 font-bold">Reason for Failure</h3>
            <p className="text-xs text-red-900/80 leading-relaxed font-mono bg-white p-3 border border-red-100 rounded-sm">
              {error || 'Checkout dismissed or payment transaction failed by Razorpay verification.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <button 
              onClick={handleRetry}
              className="w-full sm:w-auto inline-block bg-primary text-white font-label uppercase tracking-[0.2em] text-[10px] px-8 py-5 hover:bg-[#082717] transition-all font-bold text-center"
            >
              Retry Payment
            </button>
            
            <Link 
              to="/cart" 
              className="w-full sm:w-auto inline-block border border-primary text-primary font-label uppercase tracking-[0.2em] text-[10px] px-8 py-5 hover:bg-primary hover:text-white transition-all font-bold text-center"
            >
              Return to Cart
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

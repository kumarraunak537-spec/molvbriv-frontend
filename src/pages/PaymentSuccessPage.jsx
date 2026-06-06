import React, { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { analytics } from '../services/analytics'

export default function PaymentSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  useEffect(() => {
    if (order) {
      analytics.trackPurchase(order)
    }
  }, [order]);


  // Render dummy / placeholder receipt in case of direct access
  const displayOrder = order || {
    id: 'MB-10492-SIM',
    razorpay_order_id: 'rzp_order_sim_10492',
    payment_id: 'pay_sim_120491',
    total_amount: 14299,
    customer_name: 'Rocky Kumar',
    customer_email: 'roy839693@gmail.com',
    payment_method: 'Online',
    payment_status: 'Paid',
    products: []
  };

  return (
    <div className="bg-background font-body text-on-surface min-h-screen antialiased flex flex-col selection:bg-secondary-container">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center pt-32 pb-24 px-6 md:px-16 max-w-7xl mx-auto w-full">
        <div 
          className="max-w-[620px] w-full text-center space-y-8 glass-card p-8 md:p-12 shadow-sm border border-outline-variant/20 rounded-lg" 
          style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' }}
        >
          {/* Animated Success Check Icon */}
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary animate-pulse">
            <svg 
              className="w-10 h-10 stroke-current text-primary" 
              viewBox="0 0 24 24" 
              fill="none" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" className="animate-dash" />
            </svg>
          </div>

          <div className="space-y-3">
            <span className="font-label uppercase tracking-widest text-[10px] text-secondary font-bold">Transaction Successful</span>
            <h1 className="font-headline text-4xl md:text-5xl text-primary font-bold tracking-tight">Order Confirmed</h1>
            <p className="text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
              Thank you for choosing MOLVBRIV. A receipt and private white-glove shipping timeline has been sent to <span className="font-semibold text-primary">{displayOrder.customer_email}</span>.
            </p>
          </div>

          {/* Receipt Info Card */}
          <div className="bg-[#f7f3ed] p-6 rounded-sm text-left space-y-4 my-8 border border-black/5">
            <h3 className="font-headline text-lg text-primary border-b border-black/10 pb-2">Receipt Details</h3>
            
            <div className="grid grid-cols-2 gap-y-3 text-xs">
              <span className="text-on-surface-variant uppercase tracking-wider text-[9px] font-bold">Order ID</span>
              <span className="text-right font-medium text-primary">{displayOrder.razorpay_order_id || displayOrder.id}</span>

              <span className="text-on-surface-variant uppercase tracking-wider text-[9px] font-bold">Payment ID</span>
              <span className="text-right font-medium text-primary">{displayOrder.payment_id || displayOrder.razorpay_payment_id || 'COD'}</span>

              <span className="text-on-surface-variant uppercase tracking-wider text-[9px] font-bold">Payment Method</span>
              <span className="text-right font-medium">{displayOrder.payment_method}</span>

              <span className="text-on-surface-variant uppercase tracking-wider text-[9px] font-bold">Boutique Total</span>
              <span className="text-right font-headline text-sm font-semibold text-primary">₹{parseFloat(displayOrder.total_amount || displayOrder.total_price || 0).toLocaleString()}.00</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link 
              to="/" 
              className="w-full sm:w-auto inline-block bg-primary text-white font-label uppercase tracking-[0.2em] text-[10px] px-8 py-5 hover:bg-[#082717] transition-all font-bold text-center"
            >
              CONTINUE SHOPPING
            </Link>
            
            <Link 
              to="/orders" 
              className="w-full sm:w-auto inline-block border border-primary text-primary font-label uppercase tracking-[0.2em] text-[10px] px-8 py-5 hover:bg-primary hover:text-white transition-all font-bold text-center"
            >
              View Order History
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

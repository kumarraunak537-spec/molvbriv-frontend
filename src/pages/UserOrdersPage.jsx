import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useCart } from '../context/CartContext'
import { supabase } from '../supabaseClient'
import { updateSEO } from '../utils/seo'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'https://molvbriv-frontend.onrender.com';

export default function UserOrdersPage() {
  const { isLoggedIn, user } = useCart()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoadingId, setActionLoadingId] = useState(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    updateSEO({
      title: "Your Order History — Molvbriv",
      description: "Securely view and manage your history of luxury fine jewelry purchases from Molvbriv."
    })
  }, [])

  useEffect(() => {
    if (!isLoggedIn && !isLoading) {
      navigate('/login')
      return
    }

    async function fetchUserOrders() {
      if (!user) return
      setIsLoading(true)
      try {
        const { data, error: fetchErr } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (fetchErr) throw fetchErr
        setOrders(data || [])
      } catch (err) {
        console.error('Error fetching user orders:', err)
        setError('Failed to retrieve order history.')
      } finally {
        setIsLoading(false)
      }
    }

    if (isLoggedIn && user) {
      fetchUserOrders()
    } else {
      // Small timeout to wait for session load on boot
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isLoggedIn, user, navigate])

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this bespoke order?')) return;
    
    setActionLoadingId(orderId);
    try {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      const token = activeSession?.access_token;
      
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to cancel order.');
      }
      
      // Update local state smoothly
      setOrders(prevOrders => 
        prevOrders.map(ord => 
          ord.id === orderId 
            ? { ...ord, order_status: 'Cancelled', status: 'cancelled', payment_status: ord.payment_status === 'paid' ? 'refunded' : ord.payment_status }
            : ord
        )
      );
      
      alert('Order cancelled successfully.');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to cancel order. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  }

  const handleReturnOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to request a return for this delivered jewelry item?')) return;
    
    setActionLoadingId(orderId);
    try {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      const token = activeSession?.access_token;
      
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to process return request.');
      }
      
      // Update local state smoothly
      setOrders(prevOrders => 
        prevOrders.map(ord => 
          ord.id === orderId 
            ? { ...ord, order_status: 'Returned', status: 'returned' }
            : ord
        )
      );
      
      alert('Your return request has been recorded. Our concierge will contact you shortly to coordinate return pickup.');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to process return request. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  }

  const getStatusStep = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 0
      case 'paid': return 1
      case 'processing': return 2
      case 'shipped': return 3
      case 'delivered': return 4
      case 'cancelled': return -1
      case 'returned': return -2
      default: return 0
    }
  }

  const trackingSteps = ['Placed', 'Paid', 'Processing', 'Shipped', 'Delivered']

  return (
    <div className="bg-background font-body text-on-surface min-h-screen antialiased flex flex-col selection:bg-secondary-container">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 px-6 md:px-16 max-w-5xl mx-auto w-full">
        {/* Header */}
        <header className="mb-12 text-center">
          <span className="text-secondary tracking-[0.3em] uppercase text-[10px] md:text-xs font-bold mb-3 block">My Account</span>
          <h1 className="font-headline text-4xl md:text-5xl text-primary font-bold tracking-tight">Order History</h1>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">Loading Sourcing Archives...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-[#f7f3ed] p-8 border border-black/5 rounded-sm">
            <p className="text-sm text-red-600 mb-6 font-semibold">{error}</p>
            <button onClick={() => window.location.reload()} className="inline-block bg-primary text-white font-label uppercase tracking-widest text-[10px] px-6 py-4 font-bold hover:bg-black transition-colors">
              Retry Load
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-[#f7f3ed] p-10 border border-black/5 rounded-sm space-y-6">
            <h3 className="font-headline text-2xl text-on-surface-variant italic font-light">No boutique orders found</h3>
            <p className="text-sm text-on-surface-variant max-w-sm mx-auto leading-relaxed">
              You haven't placed any jewelry orders yet. Explore our bespoke collections to commission your first masterpiece.
            </p>
            <Link to="/collections" className="inline-block bg-primary text-white font-label uppercase tracking-[0.2em] text-[10px] px-8 py-5 hover:bg-[#082717] transition-all font-bold">
              Explore Collections
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {orders.map((order) => {
              const currentStep = getStatusStep(order.order_status)
              const isCancelled = currentStep === -1
              const isReturned = currentStep === -2

              return (
                <div 
                  key={order.id} 
                  className="p-6 md:p-10 shadow-sm border border-outline-variant/20 rounded-none space-y-8" 
                  style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' }}
                >
                  {/* Order Overview Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-on-surface/5 gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-headline text-lg text-primary font-bold">Order ID: {order.razorpay_order_id || order.id?.substring(0, 13)}</span>
                        {isCancelled && <span className="bg-red-500/10 text-red-600 text-[9px] font-label uppercase tracking-widest px-2 py-0.5 font-bold">Cancelled</span>}
                        {isReturned && <span className="bg-orange-500/10 text-orange-600 text-[9px] font-label uppercase tracking-widest px-2 py-0.5 font-bold">Returned</span>}
                      </div>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Placed on: {new Date(order.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-[9px] uppercase tracking-widest text-on-surface-variant">Boutique Total</p>
                      <p className="font-headline text-xl text-primary font-bold">₹{parseFloat(order.total_amount || order.total_price || 0).toLocaleString()}.00</p>
                    </div>
                  </div>

                  {/* Products Grid */}
                  <div className="space-y-6">
                    {order.products && Array.isArray(order.products) && order.products.map((prod, idx) => (
                      <div key={idx} className="flex gap-6 items-center">
                        <div className="w-16 h-20 bg-surface-container overflow-hidden shrink-0 border border-black/5">
                          <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-headline text-md text-primary font-semibold">{prod.name}</h4>
                            <span className="font-headline text-sm">₹{parseFloat(prod.price * prod.quantity).toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-on-surface-variant/80 mt-1 max-w-md line-clamp-1">{prod.description}</p>
                          <div className="flex items-center gap-6 mt-2 text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
                            <span>Qty: {String(prod.quantity).padStart(2, '0')}</span>
                            <span>•</span>
                            <span>Rate: ₹{parseFloat(prod.price).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tracking Timeline Bar */}
                  {!isCancelled && !isReturned && (
                    <div className="pt-6 border-t border-on-surface/5 space-y-6">
                      <div className="flex justify-between items-center">
                        <span className="font-label text-[10px] uppercase tracking-widest font-bold text-primary">Sourcing & Courier Progress</span>
                        <span className="bg-[#1a4a35]/10 text-primary text-[9px] font-label uppercase tracking-widest px-2.5 py-1 font-bold">
                          {order.order_status || 'Pending'}
                        </span>
                      </div>

                      {/* Timeline graphic */}
                      <div className="relative">
                        {/* Connecting Line */}
                        <div className="absolute top-[9px] left-0 right-0 h-[2px] bg-black/5 -z-10"></div>
                        <div 
                          className="absolute top-[9px] left-0 h-[2px] bg-primary -z-10 transition-all duration-1000 ease-out" 
                          style={{ width: `${(currentStep / 4) * 100}%` }}
                        ></div>

                        {/* Steps points */}
                        <div className="flex justify-between items-center text-center">
                          {trackingSteps.map((step, sIdx) => {
                            const isCompleted = currentStep >= sIdx
                            const isCurrent = currentStep === sIdx

                            return (
                              <div key={sIdx} className="flex flex-col items-center">
                                <div 
                                  className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-500
                                  ${isCompleted ? 'bg-primary border-primary text-white' : 'bg-[#faf8f5] border-black/10 text-black/30'}
                                  ${isCurrent ? 'scale-110 shadow-sm ring-4 ring-primary/10' : ''}
                                  `}
                                >
                                  {isCompleted ? (
                                    <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                                  ) : (
                                    <span className="text-[9px] font-semibold">{sIdx + 1}</span>
                                  )}
                                </div>
                                <span className={`text-[9px] font-label uppercase tracking-wider mt-2 font-semibold block
                                  ${isCompleted ? 'text-primary' : 'text-on-surface-variant/40'}
                                  ${isCurrent ? 'font-bold' : 'font-normal'}
                                `}>
                                  {step}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions & Payment Info */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-6 border-t border-on-surface/5 gap-4">
                    <div className="text-xs text-on-surface-variant space-y-1">
                      <p>Payment Method: <span className="font-semibold text-primary">{order.payment_method}</span></p>
                      <p>Payment Status: <span className="font-semibold text-primary">{order.payment_status}</span></p>
                      {order.payment_id && <p>Transaction ID: <span className="font-mono text-[10px]">{order.payment_id}</span></p>}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-end font-semibold">
                      {/* Cancel Order Button */}
                      {!isCancelled && !isReturned && ['pending', 'paid', 'processing'].includes(order.order_status?.toLowerCase()) && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={actionLoadingId === order.id}
                          className="w-full sm:w-auto bg-red-600/10 text-red-600 font-label uppercase tracking-widest text-[9px] px-6 py-3.5 hover:bg-red-600 hover:text-white transition-all font-bold text-center disabled:opacity-50"
                        >
                          {actionLoadingId === order.id ? 'Processing...' : 'Cancel Order'}
                        </button>
                      )}

                      {/* Return Order Button */}
                      {!isCancelled && !isReturned && (
                        <button
                          onClick={() => handleReturnOrder(order.id)}
                          disabled={actionLoadingId === order.id || order.order_status?.toLowerCase() !== 'delivered'}
                          title={order.order_status?.toLowerCase() !== 'delivered' ? 'Return available only after delivery' : 'Request Return'}
                          className={`w-full sm:w-auto font-label uppercase tracking-widest text-[9px] px-6 py-3.5 transition-all font-bold text-center disabled:opacity-50
                            ${order.order_status?.toLowerCase() === 'delivered' 
                              ? 'bg-orange-600/10 text-orange-600 hover:bg-orange-600 hover:text-white cursor-pointer' 
                              : 'bg-[#faf8f5] border border-black/10 text-black/30 cursor-not-allowed'
                            }`}
                        >
                          {actionLoadingId === order.id ? 'Processing...' : 'Return Order'}
                        </button>
                      )}

                      <Link 
                        to={`/track-order?id=${order.razorpay_order_id || order.id}&email=${order.customer_email}`}
                        className="w-full sm:w-auto inline-block border border-primary/30 text-primary font-label uppercase tracking-widest text-[9px] px-6 py-3.5 hover:border-primary transition-all font-bold text-center"
                      >
                        Track Order
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

import React, { useState } from 'react';
import Navbar from '../components/Navbar';

export default function OrderTrackingPage() {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [trackingStep, setTrackingStep] = useState(0);

  const handleTrack = (e) => {
    e.preventDefault();
    if (orderId && email) {
      setIsTracking(true);
      // Simulate API call for tracking
      setTimeout(() => setTrackingStep(2), 1500); // 0=Placed, 1=Processing, 2=Shipped, 3=Delivered
    }
  };

  return (
    <div className="bg-background min-h-screen text-on-background font-body selection:bg-secondary/20">
      <Navbar />

      <div className="pt-32 pb-20 px-5 md:px-12 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-secondary tracking-[0.3em] uppercase text-[10px] md:text-xs font-bold mb-4 block">Concierge Services</span>
          <h1 className="text-4xl md:text-5xl font-manrope text-primary mb-6">
            Track Your Order
          </h1>
          <p className="text-on-surface-variant text-sm md:text-base leading-relaxed max-w-lg mx-auto">
            Enter your order details below to track the journey of your Molvbriv masterpiece.
          </p>
        </div>

        <div className="bg-surface p-8 md:p-12 shadow-sm border border-black/5">
          {!isTracking ? (
            <form onSubmit={handleTrack} className="space-y-8 max-w-lg mx-auto">
              <div className="space-y-2">
                <label htmlFor="orderId" className="text-xs uppercase tracking-widest text-on-surface-variant font-medium">Order ID</label>
                <input
                  type="text"
                  id="orderId"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g. MB-10492"
                  className="w-full bg-transparent border-b border-black/20 pb-2 text-primary focus:outline-none focus:border-black transition-colors placeholder:text-black/30"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-xs uppercase tracking-widest text-on-surface-variant font-medium">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter the email used for purchase"
                  className="w-full bg-transparent border-b border-black/20 pb-2 text-primary focus:outline-none focus:border-black transition-colors placeholder:text-black/30"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-white py-4 font-manrope text-sm tracking-wider uppercase hover:bg-black transition-colors duration-300"
              >
                Track Order
              </button>
            </form>
          ) : (
            <div className="space-y-12 max-w-2xl mx-auto py-8">
              <div className="text-center space-y-2">
                <h3 className="font-manrope text-2xl text-primary">Order {orderId}</h3>
                <p className="text-on-surface-variant text-sm">Estimated Delivery: <span className="text-primary font-medium">Within 3-5 Business Days</span></p>
              </div>

              {/* Status Timeline */}
              <div className="relative border-l border-black/10 ml-4 md:ml-8 space-y-12">
                {/* Step 1 */}
                <div className="relative pl-8">
                  <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ${trackingStep >= 0 ? 'bg-primary' : 'bg-black/10'}`}></div>
                  <h4 className={`text-sm tracking-wider uppercase font-medium ${trackingStep >= 0 ? 'text-primary' : 'text-on-surface-variant'}`}>Order Placed</h4>
                  <p className="text-xs text-on-surface-variant mt-1">Your order has been received and confirmed.</p>
                </div>
                {/* Step 2 */}
                <div className="relative pl-8">
                  <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ${trackingStep >= 1 ? 'bg-primary' : 'bg-black/10'}`}></div>
                  <h4 className={`text-sm tracking-wider uppercase font-medium ${trackingStep >= 1 ? 'text-primary' : 'text-on-surface-variant'}`}>Processing</h4>
                  <p className="text-xs text-on-surface-variant mt-1">Our artisans are preparing your jewelry.</p>
                </div>
                {/* Step 3 */}
                <div className="relative pl-8">
                  <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ${trackingStep >= 2 ? 'bg-primary' : 'bg-black/10'}`}></div>
                  <h4 className={`text-sm tracking-wider uppercase font-medium ${trackingStep >= 2 ? 'text-primary' : 'text-on-surface-variant'}`}>Shipped</h4>
                  <p className="text-xs text-on-surface-variant mt-1">Your package has been dispatched via secure courier.</p>
                </div>
                {/* Step 4 */}
                <div className="relative pl-8">
                  <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ${trackingStep >= 3 ? 'bg-primary' : 'bg-black/10'}`}></div>
                  <h4 className={`text-sm tracking-wider uppercase font-medium ${trackingStep >= 3 ? 'text-primary' : 'text-on-surface-variant'}`}>Delivered</h4>
                  <p className="text-xs text-on-surface-variant mt-1">The package has been signed for and delivered.</p>
                </div>
              </div>

              <div className="pt-8 text-center">
                <button
                  onClick={() => { setIsTracking(false); setOrderId(''); setEmail(''); setTrackingStep(0); }}
                  className="text-xs text-secondary tracking-widest uppercase hover:text-primary transition-colors border-b border-secondary hover:border-primary pb-1"
                >
                  Track Another Order
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';

export default function OrderTrackingPage() {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [trackingStep, setTrackingStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const getStepFromStatus = (status) => {
    if (!status) return 0;
    const s = status.toLowerCase();
    if (s.includes('delivered')) return 4;
    if (s.includes('out for delivery') || s.includes('out_for_delivery') || s.includes('outfordelivery')) return 3;
    if (s.includes('shipped') || s.includes('transit') || s.includes('dispatched')) return 2;
    if (s.includes('packed') || s.includes('processing') || s.includes('ready') || s.includes('pickup') || s.includes('awb') || s.includes('label')) return 1;
    return 0; // Placed / Pending
  };

  useEffect(() => {
    let subscription;
    if (isTracking && orderDetails && orderDetails.id) {
      console.log('Initializing secure Postgres changes channel subscription for:', orderDetails.id);
      subscription = supabase
        .channel(`order-realtime-${orderDetails.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${orderDetails.id}`
          },
          (payload) => {
            console.log('Realtime database order update received:', payload.new);
            setOrderDetails(payload.new);
            const currentStatus = payload.new.shipment_status || payload.new.status || payload.new.order_status;
            setTrackingStep(getStepFromStatus(currentStatus));
          }
        )
        .subscribe((status) => {
          console.log(`Supabase Realtime subscription status for order ${orderDetails.id}:`, status);
        });
    }

    return () => {
      if (subscription) {
        console.log('Cleaning up Supabase Realtime channel for order:', orderDetails?.id);
        supabase.removeChannel(subscription);
      }
    };
  }, [isTracking, orderDetails?.id]);

  // Auto-track on mount if ID and Email exist in URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlId = params.get('id') || params.get('orderId');
    const urlEmail = params.get('email');
    if (urlId && urlEmail) {
      setOrderId(urlId);
      setEmail(urlEmail);
      
      const autoTrack = async () => {
        setErrorMsg('');
        try {
          // Method A: Secure RPC function (bypasses RLS)
          const { data: rpcData, error: rpcErr } = await supabase
            .rpc('track_order', {
              p_order_id: urlId.trim(),
              p_email: urlEmail.trim()
            });

          if (!rpcErr && rpcData && rpcData.length > 0) {
            setOrderDetails(rpcData[0]);
            setTrackingStep(getStepFromStatus(rpcData[0].status));
            setIsTracking(true);
            return;
          }

          // Method B: Direct database fallback
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('razorpay_order_id', urlId.trim())
            .eq('customer_email', urlEmail.trim())
            .maybeSingle();

          if (error || !data) {
            // Try by primary key UUID id
            const { data: uuidData, error: uuidErr } = await supabase
              .from('orders')
              .select('*')
              .eq('id', urlId.trim())
              .eq('customer_email', urlEmail.trim())
              .maybeSingle();

            if (uuidErr || !uuidData) {
              setErrorMsg("We couldn't find an order with that ID and email.");
              return;
            }
            setOrderDetails(uuidData);
            setTrackingStep(getStepFromStatus(uuidData.status));
            setIsTracking(true);
            return;
          }

          setOrderDetails(data);
          setTrackingStep(getStepFromStatus(data.status));
          setIsTracking(true);
        } catch (err) {
          setErrorMsg("Failed to track order. Please try again.");
        }
      };
      autoTrack();
    }
  }, []);

  const handleTrack = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    if (orderId && email) {
      try {
        // Method A: Try secure RPC function (bypasses RLS)
        const { data: rpcData, error: rpcErr } = await supabase
          .rpc('track_order', {
            p_order_id: orderId.trim(),
            p_email: email.trim()
          });

        if (!rpcErr && rpcData && rpcData.length > 0) {
          setOrderDetails(rpcData[0]);
          setTrackingStep(getStepFromStatus(rpcData[0].status));
          setIsTracking(true);
          return;
        }

        // Method B: Fallback to direct database select
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('razorpay_order_id', orderId.trim())
          .eq('customer_email', email.trim())
          .maybeSingle();

        if (error || !data) {
          // Fallback to checking by UUID id
          const { data: uuidData, error: uuidErr } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId.trim())
            .eq('customer_email', email.trim())
            .maybeSingle();

          if (uuidErr || !uuidData) {
            setErrorMsg("We couldn't find an order with that ID and email. Please make sure the SQL editor script has been run in your Supabase dashboard!");
            return;
          }
          setOrderDetails(uuidData);
          setTrackingStep(getStepFromStatus(uuidData.status));
          setIsTracking(true);
          return;
        }

        setOrderDetails(data);
        setTrackingStep(getStepFromStatus(data.status));
        setIsTracking(true);
      } catch (err) {
        setErrorMsg("Failed to track order. Please try again.");
      }
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

              {errorMsg && (
                <div className="text-error text-sm text-center py-2">
                  {errorMsg}
                </div>
              )}

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
                <h3 className="font-manrope text-2xl text-primary font-bold">Order {orderId}</h3>
                <p className="text-on-surface-variant text-sm">Estimated Delivery: <span className="text-primary font-medium">Within 3-5 Business Days</span></p>
              </div>

              {/* Logistics Metadata Card */}
              {orderDetails && orderDetails.awb_code && (
                <div className="bg-primary/5 p-6 rounded-lg border border-secondary/20 space-y-4">
                  <div className="flex items-center justify-between border-b border-black/5 pb-2">
                    <h4 className="text-xs uppercase tracking-widest text-secondary font-bold font-manrope">Logistics Information</h4>
                    <span className="bg-secondary/10 text-secondary text-[10px] uppercase tracking-widest px-2.5 py-1 font-bold rounded">
                      {orderDetails.shipment_status || 'Pre-Transit'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Courier Partner</p>
                      <p className="font-semibold text-primary font-manrope">{orderDetails.courier_name || 'Shiprocket Delivery Partner'}</p>
                    </div>
                    <div>
                      <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">AWB / Tracking ID</p>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-primary">{orderDetails.awb_code}</span>
                        <a
                          href={`https://shiprocket.co/tracking/${orderDetails.awb_code}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-secondary hover:text-primary transition-colors underline font-medium"
                        >
                          Track Live ↗
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Timeline */}
              <div className="relative border-l border-primary/20 ml-4 md:ml-8 space-y-10 py-2">
                {/* Step 0: Order Placed */}
                <div className="relative pl-8 group">
                  <div className={`absolute -left-[7px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-surface transition-all duration-300 ${trackingStep >= 0 ? 'bg-secondary shadow-[0_0_10px_rgba(212,175,55,0.6)]' : 'bg-black/10'}`}></div>
                  <h4 className={`text-sm tracking-wider uppercase font-manrope font-semibold transition-colors ${trackingStep >= 0 ? 'text-secondary font-bold' : 'text-on-surface-variant'}`}>Order Placed</h4>
                  <p className="text-xs text-on-surface-variant mt-1">Your order has been received, verified, and secured.</p>
                </div>

                {/* Step 1: Packed */}
                <div className="relative pl-8 group">
                  <div className={`absolute -left-[7px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-surface transition-all duration-300 ${trackingStep >= 1 ? 'bg-secondary shadow-[0_0_10px_rgba(212,175,55,0.6)]' : 'bg-black/10'}`}></div>
                  <h4 className={`text-sm tracking-wider uppercase font-manrope font-semibold transition-colors ${trackingStep >= 1 ? 'text-secondary font-bold' : 'text-on-surface-variant'}`}>Packed & Prepared</h4>
                  <p className="text-xs text-on-surface-variant mt-1">Your masterpiece has been polished, quality-checked, and packaged beautifully.</p>
                </div>

                {/* Step 2: Shipped */}
                <div className="relative pl-8 group">
                  <div className={`absolute -left-[7px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-surface transition-all duration-300 ${trackingStep >= 2 ? 'bg-secondary shadow-[0_0_10px_rgba(212,175,55,0.6)]' : 'bg-black/10'}`}></div>
                  <h4 className={`text-sm tracking-wider uppercase font-manrope font-semibold transition-colors ${trackingStep >= 2 ? 'text-secondary font-bold' : 'text-on-surface-variant'}`}>Shipped</h4>
                  <p className="text-xs text-on-surface-variant mt-1">Dispatched via secure luxury logistics. Tracking has been assigned.</p>
                </div>

                {/* Step 3: Out for Delivery */}
                <div className="relative pl-8 group">
                  <div className={`absolute -left-[7px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-surface transition-all duration-300 ${trackingStep >= 3 ? 'bg-secondary shadow-[0_0_10px_rgba(212,175,55,0.6)]' : 'bg-black/10'}`}></div>
                  <h4 className={`text-sm tracking-wider uppercase font-manrope font-semibold transition-colors ${trackingStep >= 3 ? 'text-secondary font-bold' : 'text-on-surface-variant'}`}>Out For Delivery</h4>
                  <p className="text-xs text-on-surface-variant mt-1">A curated courier partner is delivering your shipment today.</p>
                </div>

                {/* Step 4: Delivered */}
                <div className="relative pl-8 group">
                  <div className={`absolute -left-[7px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-surface transition-all duration-300 ${trackingStep >= 4 ? 'bg-secondary shadow-[0_0_10px_rgba(212,175,55,0.6)]' : 'bg-black/10'}`}></div>
                  <h4 className={`text-sm tracking-wider uppercase font-manrope font-semibold transition-colors ${trackingStep >= 4 ? 'text-secondary font-bold' : 'text-on-surface-variant'}`}>Delivered</h4>
                  <p className="text-xs text-on-surface-variant mt-1">Successfully hand-delivered. We hope you cherish your Molvbriv creation.</p>
                </div>
              </div>

              {/* Detailed Shipment History Activity Checkpoints */}
              {orderDetails && orderDetails.shipment_history && orderDetails.shipment_history.length > 0 && (
                <div className="border border-black/5 rounded-lg overflow-hidden bg-surface mt-6 shadow-sm">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-full p-5 flex justify-between items-center text-left hover:bg-black/5 transition-colors focus:outline-none"
                  >
                    <span className="text-xs uppercase tracking-widest text-primary font-bold font-manrope">Detailed Shipment Milestones</span>
                    <span className="text-secondary text-sm font-semibold">{showHistory ? '▲ Hide' : '▼ View'}</span>
                  </button>
                  {showHistory && (
                    <div className="bg-[#FAF9F6] p-5 border-t border-black/5 space-y-4 max-h-[320px] overflow-y-auto">
                      {orderDetails.shipment_history.map((checkpoint, index) => (
                        <div key={index} className="flex gap-4 border-l border-secondary/30 pl-4 py-1 relative">
                          <div className="absolute left-[-5px] top-2 w-2.5 h-2.5 rounded-full bg-secondary"></div>
                          <div className="flex-1">
                            <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider block">
                              {checkpoint.date || checkpoint.timestamp || new Date().toLocaleString()}
                            </span>
                            <span className="text-sm font-medium text-primary block mt-0.5">
                              {checkpoint.activity || checkpoint.status}
                            </span>
                            {checkpoint.location && (
                              <span className="text-xs text-on-surface-variant italic block mt-0.5">
                                Location: {checkpoint.location}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-8 text-center">
                <button
                  onClick={() => { setIsTracking(false); setOrderId(''); setEmail(''); setTrackingStep(0); setShowHistory(false); }}
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

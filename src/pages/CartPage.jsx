import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useCart } from '../context/CartContext'

const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal"
];

export default function CartPage() {
  const navigate = useNavigate()
  const { cartItems, removeFromCart, updateQuantity, subtotal } = useCart()
  const [activeStep, setActiveStep] = useState(1)
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [address, setAddress] = useState('')
  const [apartment, setApartment] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('Delhi')
  const [pinCode, setPinCode] = useState('')
  const [phone, setPhone] = useState('')
  const [saveInfo, setSaveInfo] = useState(false)
  const [newsOffers, setNewsOffers] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [privilegeCode, setPrivilegeCode] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('razorpay')
  const [upiId, setUpiId] = useState('')
  const [upiVerified, setUpiVerified] = useState(null)
  const [discount, setDiscount] = useState(0)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [accordionOpen, setAccordionOpen] = useState(null)
  const [errors, setErrors] = useState({})
  const [isPaymentLoading, setIsPaymentLoading] = useState(false)

  const taxes = Math.round(subtotal * 0.08)
  const grandTotal = subtotal - discount + taxes

  const applyCode = () => {
    if (privilegeCode.toLowerCase() === 'molvbriv10') {
      setDiscount(Math.round(subtotal * 0.1))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!email) newErrors.email = true
    if (!firstName) newErrors.firstName = true
    if (!lastName) newErrors.lastName = true
    if (!address) newErrors.address = true
    if (!phone) newErrors.phone = true
    
    // Only validate Card fields if Credit Card payment method is chosen
    if (paymentMethod === 'visa') {
      if (!cardNumber) newErrors.cardNumber = true
      if (!expiry) newErrors.expiry = true
      if (!cvv) newErrors.cvv = true
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const completePurchase = async () => {
    if (validateForm()) {
      if (paymentMethod === 'cod') {
        setShowConfirmation(true)
        window.scrollTo(0, 0)
      } else {
        setIsPaymentLoading(true)
        const isLoaded = await loadRazorpayScript()
        if (!isLoaded) {
          alert('Razorpay SDK failed to load. Please check your internet connection.')
          setIsPaymentLoading(false)
          return
        }

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_SsUdDbfNytrJV9',
          amount: grandTotal * 100, // in paise
          currency: 'INR',
          name: 'MOLVBRIV',
          description: 'Timeless Luxury Jewelry Sourcing & Purchase',
          image: 'https://images.unsplash.com/photo-1515562141589-67f0d954ca94?w=200&h=200&fit=crop',
          handler: function (response) {
            setIsPaymentLoading(false)
            setShowConfirmation(true)
            window.scrollTo(0, 0)
          },
          prefill: {
            name: `${firstName} ${lastName}`,
            email: email,
            contact: phone
          },
          notes: {
            address: `${address}, ${apartment}, ${city}, ${state} - ${pinCode}`
          },
          theme: {
            color: '#1a4a35'
          },
          modal: {
            ondismiss: function () {
              setIsPaymentLoading(false)
            }
          }
        }

        try {
          const rzp = new window.Razorpay(options)
          rzp.open()
        } catch (err) {
          console.error('Razorpay initialization error:', err)
          alert('Failed to initialize Razorpay payment. Please try again.')
          setIsPaymentLoading(false)
        }
      }
    } else {
      setActiveStep(activeStep > 1 ? activeStep : 1)
    }
  }

  const steps = [
    { num: '01', label: 'Cart' },
    { num: '02', label: 'Shipping' },
    { num: '03', label: 'Payment' },
  ]

  if (showConfirmation) {
    return (
      <div className="bg-background font-body text-on-surface min-h-screen antialiased flex flex-col selection:bg-secondary-container">
        <Navbar />
        <main className="flex-1 flex items-center justify-center pt-32 pb-24 px-6 md:px-16 max-w-7xl mx-auto w-full">
          <div className="max-w-[600px] w-full text-center space-y-8 glass-card p-12 shadow-sm border border-outline-variant/20 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' }}>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
              <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>check</span>
            </div>
            <h1 className="font-headline text-4xl lg:text-5xl text-primary font-bold tracking-tight">Order Complete</h1>
            <div className="space-y-2">
              <p className="font-label uppercase tracking-widest text-[10px] text-secondary mb-2 font-bold">Thank you for your purchase</p>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Your order #{Math.floor(Math.random() * 900000 + 100000)} has been placed.<br/>
                A receipt and delivery timeline has been sent to <span className="font-semibold text-primary">{email || 'your email address'}</span>.
              </p>
            </div>
            <div className="border-t border-b border-outline-variant/30 py-8 my-8">
              <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-label mb-2">Total Amount Secured</p>
              <p className="font-headline text-3xl text-primary">₹{grandTotal.toLocaleString()}.00</p>
            </div>
            <Link to="/" className="inline-block bg-primary text-white font-label uppercase tracking-[0.2em] text-[10px] px-8 py-5 hover:bg-primary-container transition-all font-bold">
              Continue to Boutique
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="bg-background font-body text-on-surface min-h-screen antialiased flex flex-col selection:bg-secondary-container">
      {/* Desktop View */}
      <div className="hidden md:flex flex-col min-h-screen w-full">
        <Navbar />
        
        <main className="flex-1 pt-32 pb-24 px-6 md:px-16 max-w-7xl mx-auto w-full">
        {/* Breadcrumb / Header */}
        <header className="mb-16 text-center">
          <h1 className="font-headline text-5xl md:text-6xl text-primary font-bold tracking-tight mb-4">Your Selection</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Left Column: Cart & Checkout Steps */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Cart Items Section */}
            <section className="p-8 md:p-12 shadow-sm rounded-none border border-white/10" style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' }}>
              <div className="flex justify-between items-end mb-10 pb-4 border-b border-on-surface/5">
                <h2 className="font-headline text-2xl text-primary">Shopping Cart</h2>
                <span className="font-label text-sm text-on-surface-variant">{cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}</span>
              </div>
              
              <div className="space-y-10">
                {cartItems.length === 0 ? (
                   <div className="text-center py-12">
                     <p className="font-headline text-2xl text-on-surface-variant italic mb-6">Your selection is empty</p>
                     <Link to="/collections" className="inline-block border text-primary border-primary px-8 py-3 font-label text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all font-bold">
                       Explore Collections
                     </Link>
                   </div>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.id} className="flex flex-col md:flex-row gap-8 items-start">
                      <div className="w-full md:w-40 aspect-[4/5] bg-surface-container overflow-hidden shrink-0">
                        <img alt={item.name} className="w-full h-full object-cover" src={item.image} />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="flex justify-between">
                          <h3 className="font-headline text-xl text-primary">{item.name}</h3>
                          <span className="font-headline text-lg">₹{item.price.toLocaleString()}.00</span>
                        </div>
                        <p className="text-on-surface-variant text-sm leading-relaxed max-w-md">{item.description}</p>
                        <div className="flex items-center gap-8 pt-4">
                          <div className="flex items-center border border-outline-variant/30 px-3 py-1">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="material-symbols-outlined text-sm hover:text-primary transition-colors">remove</button>
                            <span className="px-6 font-label text-sm font-semibold">{String(item.quantity).padStart(2, '0')}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="material-symbols-outlined text-sm hover:text-primary transition-colors">add</button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="text-xs uppercase tracking-widest text-on-surface-variant hover:text-error transition-colors flex items-center gap-2 font-semibold">
                            <span className="material-symbols-outlined text-sm">delete</span>
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Personal Details */}
            <section className="bg-surface p-8 md:p-12 space-y-6">
              <h2 className="font-headline text-3xl text-primary mb-8">Personal Details</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant ml-1">Country/Region</label>
                  <div className="relative">
                    <select className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm appearance-none rounded-sm">
                      <option>India</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none">expand_more</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant ml-1">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.email ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                  {errors.email && <p className="text-[10px] text-red-500 ml-1">Email is required</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant ml-1">First name</label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant ml-1">Last name</label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant ml-1">Address</label>
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Address" className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant ml-1">Apartment, suite, etc. (optional)</label>
                  <input type="text" value={apartment} onChange={e => setApartment(e.target.value)} placeholder="Apartment, suite, etc. (optional)" className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant ml-1">City</label>
                    <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="City" className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant ml-1">State</label>
                    <div className="relative">
                      <select value={state} onChange={e => setState(e.target.value)} className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm appearance-none rounded-sm">
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none">expand_more</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant ml-1">PIN code</label>
                    <input type="text" value={pinCode} onChange={e => setPinCode(e.target.value)} placeholder="PIN code" className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant ml-1">Phone</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm" />
                  </div>
                </div>

                <div className="pt-2 space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-all ${saveInfo ? 'bg-primary border-primary' : 'border-outline-variant/30 group-hover:border-primary/50'}`} onClick={() => setSaveInfo(!saveInfo)}>
                      {saveInfo && <span className="material-symbols-outlined text-white text-[16px]">check</span>}
                    </div>
                    <span className="text-sm text-on-surface-variant">Save this information for next time</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-all ${newsOffers ? 'bg-primary border-primary' : 'border-outline-variant/30 group-hover:border-primary/50'}`} onClick={() => setNewsOffers(!newsOffers)}>
                      {newsOffers && <span className="material-symbols-outlined text-white text-[16px]">check</span>}
                    </div>
                    <span className="text-sm text-on-surface-variant">Text me with news and offers</span>
                  </label>
                </div>
              </div>
            </section>

            {/* Payment Integration */}
            <section className="bg-surface p-8 md:p-12 border-t border-on-surface/5 space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="font-headline text-3xl text-primary">Secure Payment</h2>
                <div className="flex items-center gap-1 text-on-surface-variant/50">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  <span className="text-[10px] font-label uppercase tracking-widest">Encrypted</span>
                </div>
              </div>
              
              <div className="bg-[#f7f3ed] rounded-sm p-3 space-y-2">
                {/* Razorpay Online Payment */}
                <div onClick={() => setPaymentMethod('razorpay')} className={`flex items-center justify-between p-5 rounded-sm cursor-pointer transition-all ${paymentMethod === 'razorpay' ? 'bg-white shadow-sm border border-[#765931]/40' : ''}`}>
                  <div className={`flex items-center gap-4 ${paymentMethod === 'razorpay' ? '' : 'opacity-50'}`}>
                    <div className="w-12 h-8 bg-[#0F1C3F] rounded-[3px] flex items-center justify-center text-white">
                      <span className="text-[10px] font-bold tracking-tight">Razorpay</span>
                    </div>
                    <span className="text-sm font-semibold">Online Payment (UPI, Card, NetBanking, Wallets)</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full ${paymentMethod === 'razorpay' ? 'border-4 border-[#765931]' : 'border-2 border-outline-variant/30'} bg-white transition-all`}></div>
                </div>

                {/* Cash on Delivery */}
                <div onClick={() => setPaymentMethod('cod')} className={`flex items-center justify-between p-5 rounded-sm cursor-pointer transition-all ${paymentMethod === 'cod' ? 'bg-white shadow-sm border border-[#765931]/40' : ''}`}>
                  <div className={`flex items-center gap-4 ${paymentMethod === 'cod' ? '' : 'opacity-50'}`}>
                    <div className="w-12 h-8 bg-[#082717] rounded-[3px] flex items-center justify-center">
                      <svg viewBox="0 0 40 24" width="40" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" fill="#d4af37" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="7">COD</text>
                        <path d="M5 18h5" stroke="#d4af37" strokeWidth="0.8" opacity="0.5"/>
                        <path d="M30 18h5" stroke="#d4af37" strokeWidth="0.8" opacity="0.5"/>
                      </svg>
                    </div>
                    <span className="text-sm font-semibold">Cash on Delivery</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full ${paymentMethod === 'cod' ? 'border-4 border-[#765931]' : 'border-2 border-outline-variant/30'} bg-white transition-all`}></div>
                </div>
              </div>
            </section>
            
          </div>

          {/* Right Column: Summary & Utility */}
          <aside className="lg:col-span-4 space-y-8 sticky top-32">
            {/* Order Summary Card */}
            <div className="bg-primary text-white p-8 md:p-10 shadow-2xl">
              <h3 className="font-headline text-xl mb-8 border-b border-white/10 pb-4">Summary</h3>
              <div className="space-y-4 font-label text-sm text-white/70">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white">₹{subtotal.toLocaleString()}.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-white">Complimentary</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes</span>
                  <span className="text-white">₹{taxes.toLocaleString()}.00</span>
                </div>
                
                {/* Discount Field */}
                <div className="pt-6 pb-2">
                  <div className="flex border-b border-white/20 pb-2">
                    <input
                      type="text"
                      value={privilegeCode}
                      onChange={(e) => setPrivilegeCode(e.target.value)}
                      placeholder="Privilege Code"
                      className="bg-transparent border-none focus:ring-0 text-white placeholder:text-white/30 text-xs flex-1 outline-none"
                    />
                    <button onClick={applyCode} className="text-[10px] uppercase tracking-widest text-secondary-fixed">Apply</button>
                  </div>
                  {discount > 0 && <p className="text-[10px] text-secondary-fixed mt-2">-₹{discount.toLocaleString()}.00 discount applied!</p>}
                </div>
                
                <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                  <span className="text-white uppercase tracking-widest text-xs">Grand Total</span>
                  <span className="text-3xl font-headline text-secondary-fixed-dim">₹{grandTotal.toLocaleString()}.00</span>
                </div>
              </div>
              
              <button 
                onClick={completePurchase} 
                disabled={isPaymentLoading}
                className="w-full mt-10 py-5 bg-secondary text-white font-label uppercase tracking-[0.3em] text-[11px] font-bold shadow-lg hover:bg-on-secondary-container transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPaymentLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Pay Now
                    <span className="material-symbols-outlined text-sm">lock</span>
                  </>
                )}
              </button>
              
              <p className="text-[10px] text-center mt-6 text-white/40 leading-relaxed font-label">
                Transactions are secured by 256-bit encryption. <br/>
                Complimentary white-glove delivery included.
              </p>
            </div>

            {/* FAQ Accordion */}
            <div className="space-y-4">
              <h4 className="font-headline text-lg text-primary">Need Assistance?</h4>
              <div className="space-y-1">
                {['Shipping & Returns', 'Bespoke Sizing', 'Track My Order'].map((item) => (
                  <details 
                    key={item} 
                    className="group bg-surface-container-low p-4" 
                    open={accordionOpen === item} 
                    onClick={(e) => { 
                      e.preventDefault()
                      setAccordionOpen(accordionOpen === item ? null : item) 
                    }}
                  >
                    <summary className="list-none flex justify-between items-center cursor-pointer font-label text-xs uppercase tracking-widest font-semibold">
                      {item}
                      <span className={`material-symbols-outlined transition-transform ${accordionOpen === item ? 'rotate-180' : ''}`}>expand_more</span>
                    </summary>
                    {accordionOpen === item && (
                      <p className="mt-4 text-xs text-on-surface-variant leading-relaxed">
                        {item === 'Shipping & Returns' && "We offer complimentary insured shipping globally. Unworn items may be returned within 30 days in their original packaging with the security seal intact."}
                        {item === 'Bespoke Sizing' && "Complimentary resizing is available for all ring purchases within 6 months of delivery. Please contact our Concierge."}
                        {item === 'Track My Order' && "Once dispatched, you will receive a private tracking link and a direct contact for our delivery partner."}
                      </p>
                    )}
                  </details>
                ))}
              </div>
            </div>

            {/* Help Link */}
            <div className="flex items-center gap-4 p-4 border border-outline-variant/30 text-on-surface-variant">
              <span className="material-symbols-outlined text-secondary">support_agent</span>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-widest font-bold">Client Advisor</p>
                <p className="text-xs">Speak with a specialist now</p>
              </div>
              <span className="material-symbols-outlined">chevron_right</span>
            </div>
          </aside>

        </div>
      </main>

      <Footer />
      </div>

      {/* Mobile View */}
      <div className="md:hidden flex flex-col min-h-screen bg-[#fdf9f3] pb-10">
        {/* Header */}
        <header className="flex justify-between items-center py-4 px-6 bg-[#fdf9f3] sticky top-0 z-50">
          <button onClick={() => navigate('/')} className="material-symbols-outlined text-on-surface">close</button>
          <Link
            to="/"
            className="text-lg md:text-3xl font-medium tracking-[0.15em] md:tracking-[0.25em] text-[#1a4a35] font-serif uppercase transition-opacity hover:opacity-100"
            style={{ textRendering: 'optimizeLegibility' }}
          >
            MOLVBRIV
          </Link>
          <div className="relative">
             <span className="material-symbols-outlined text-on-surface">shopping_bag</span>
             {cartItems.length > 0 && <span className="absolute -top-1 -right-1 bg-black text-white text-[9px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-medium">{cartItems.length}</span>}
          </div>
        </header>



        <main className="flex-1 px-6">
          <h1 className="font-headline text-3xl text-primary mb-8">Your Selection</h1>

          {/* Cart Items */}
          <div className="space-y-8">
            {cartItems.length === 0 ? (
               <p className="text-on-surface-variant text-sm italic">Your cart is empty.</p>
            ) : (
              cartItems.map(item => (
                <div key={item.id} className="flex gap-6 items-center">
                  <div className="w-24 aspect-square bg-black rounded-sm overflow-hidden shrink-0">
                     <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                     <div className="flex justify-between items-start">
                        <h3 className="font-headline text-lg text-primary">{item.name}</h3>
                        <button onClick={() => removeFromCart(item.id)} className="material-symbols-outlined text-on-surface-variant text-sm">close</button>
                     </div>
                     <p className="text-[9px] font-label uppercase tracking-widest text-on-surface-variant/70 mt-1 mb-2">18K YELLOW GOLD • 1.2CT</p>
                     <p className="font-headline text-sm">₹{item.price.toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Gift Packaging */}
          <div className="mt-8 bg-[#f7f3ed] p-4 flex items-center justify-between rounded-sm">
             <div className="flex items-center gap-3">
               <span className="material-symbols-outlined text-[#765931] text-lg">redeem</span>
               <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Complimentary Gift Packaging</span>
             </div>
             <span className="material-symbols-outlined text-on-surface-variant text-sm">chevron_right</span>
          </div>

          {/* Personal Details */}
          <div className="mt-12 space-y-6">
            <h2 className="font-headline text-2xl text-primary mb-6">Personal Details</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-label uppercase tracking-widest text-on-surface-variant ml-1">Country/Region</label>
                <div className="relative">
                  <select className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm appearance-none rounded-sm">
                    <option>India</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none">expand_more</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-label uppercase tracking-widest text-on-surface-variant ml-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.email ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                {errors.email && <p className="text-[10px] text-red-500 ml-1">Email is required</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-label uppercase tracking-widest text-on-surface-variant ml-1">First name</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-label uppercase tracking-widest text-on-surface-variant ml-1">Last name</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-label uppercase tracking-widest text-on-surface-variant ml-1">Address</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Address" className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm" />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-label uppercase tracking-widest text-on-surface-variant ml-1">Apartment, suite, etc. (optional)</label>
                <input type="text" value={apartment} onChange={e => setApartment(e.target.value)} placeholder="Apartment, suite, etc. (optional)" className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-label uppercase tracking-widest text-on-surface-variant ml-1">City</label>
                  <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="City" className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-label uppercase tracking-widest text-on-surface-variant ml-1">State</label>
                  <div className="relative">
                    <select value={state} onChange={e => setState(e.target.value)} className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm appearance-none rounded-sm">
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none">expand_more</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-label uppercase tracking-widest text-on-surface-variant ml-1">PIN code</label>
                  <input type="text" value={pinCode} onChange={e => setPinCode(e.target.value)} placeholder="PIN code" className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-label uppercase tracking-widest text-on-surface-variant ml-1">Phone</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm" />
                </div>
              </div>

              <div className="pt-2 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-all ${saveInfo ? 'bg-primary border-primary' : 'border-outline-variant/30 group-hover:border-primary/50'}`} onClick={() => setSaveInfo(!saveInfo)}>
                    {saveInfo && <span className="material-symbols-outlined text-white text-[16px]">check</span>}
                  </div>
                  <span className="text-sm text-on-surface-variant">Save this information for next time</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-all ${newsOffers ? 'bg-primary border-primary' : 'border-outline-variant/30 group-hover:border-primary/50'}`} onClick={() => setNewsOffers(!newsOffers)}>
                    {newsOffers && <span className="material-symbols-outlined text-white text-[16px]">check</span>}
                  </div>
                  <span className="text-sm text-on-surface-variant">Text me with news and offers</span>
                </label>
              </div>
            </div>
          </div>

          {/* Secure Payment */}
          <div className="mt-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-headline text-2xl text-primary">Secure Payment</h2>
              <div className="flex items-center gap-1 text-on-surface-variant/50">
                <span className="material-symbols-outlined text-sm">lock</span>
                <span className="text-[8px] font-label uppercase tracking-widest">Encrypted</span>
              </div>
            </div>

             <div className="bg-[#f7f3ed] rounded-sm p-2 space-y-2">
                {/* Razorpay Online Payment */}
                <div onClick={() => setPaymentMethod('razorpay')} className={`flex items-center justify-between p-4 rounded-sm cursor-pointer transition-all ${paymentMethod === 'razorpay' ? 'bg-white shadow-sm border border-[#765931]/40' : ''}`}>
                  <div className={`flex items-center gap-4 ${paymentMethod === 'razorpay' ? '' : 'opacity-50'}`}>
                    <div className="w-10 h-6 bg-[#0F1C3F] rounded-[2.5px] flex items-center justify-center text-white">
                      <span className="text-[9px] font-bold tracking-tight">Razorpay</span>
                    </div>
                    <span className="text-sm">Online Payment (UPI, Cards, Wallets)</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full ${paymentMethod === 'razorpay' ? 'border-4 border-[#765931]' : 'border border-outline-variant/30'} bg-white`}></div>
                </div>

                {/* Cash on Delivery */}
                <div onClick={() => setPaymentMethod('cod')} className={`flex items-center justify-between p-4 rounded-sm cursor-pointer transition-all ${paymentMethod === 'cod' ? 'bg-white shadow-sm border border-[#765931]/40' : ''}`}>
                  <div className={`flex items-center gap-4 ${paymentMethod === 'cod' ? '' : 'opacity-50'}`}>
                    <div className="w-10 h-6 bg-[#082717] rounded-[2px] flex items-center justify-center">
                      <svg viewBox="0 0 40 24" width="40" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" fill="#d4af37" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="7">COD</text>
                        <path d="M5 18h5" stroke="#d4af37" strokeWidth="0.8" opacity="0.5"/>
                        <path d="M30 18h5" stroke="#d4af37" strokeWidth="0.8" opacity="0.5"/>
                      </svg>
                    </div>
                    <span className="text-sm">Cash on Delivery</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full ${paymentMethod === 'cod' ? 'border-4 border-[#765931]' : 'border border-outline-variant/30'} bg-white`}></div>
                </div>
             </div>
          </div>

          {/* Summary */}
          <div className="mt-12 bg-[#082717] text-white p-8 shadow-2xl rounded-sm">
            <h3 className="font-headline text-2xl mb-8 border-b border-white/10 pb-4">Summary</h3>
            
            <div className="space-y-4 text-sm mb-8">
              <div className="flex justify-between">
                <span className="text-white/70">Subtotal</span>
                <span>₹{subtotal.toLocaleString()}.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Shipping</span>
                <span>Complimentary</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Taxes</span>
                <span>₹{taxes.toLocaleString()}.00</span>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-white/10 pt-6 mb-6">
              <span className="text-[10px] font-label uppercase tracking-widest text-white/50">Privilege Code</span>
              <button onClick={applyCode} className="text-[10px] font-label uppercase tracking-widest text-[#d4af37]">Apply</button>
            </div>

            <div className="flex justify-between items-end mb-8 pt-4">
              <span className="text-[10px] font-label uppercase tracking-widest text-white/70">Grand Total</span>
              <span className="font-headline text-3xl text-[#d4af37]">₹{grandTotal.toLocaleString()}.00</span>
            </div>

            <button 
              onClick={completePurchase} 
              disabled={isPaymentLoading}
              className="w-full bg-[#765931] text-white py-5 flex justify-center items-center gap-3 text-[10px] font-label uppercase tracking-[0.2em] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPaymentLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Pay Now
                  <span className="material-symbols-outlined text-sm">lock</span>
                </>
              )}
            </button>

            <p className="text-[8px] font-label uppercase tracking-widest text-center mt-6 text-white/40 leading-relaxed">
              Transactions are secured by 256-bit encryption.<br/>
              Complimentary white-glove delivery included.
            </p>
          </div>

          {/* Footer links */}
          <div className="mt-16 flex flex-col items-center space-y-6">
             <span className="text-lg md:text-3xl font-medium tracking-[0.15em] md:tracking-[0.25em] text-primary font-serif uppercase" style={{ textRendering: 'optimizeLegibility' }}>MOLVBRIV</span>
             <div className="flex flex-wrap justify-center gap-4 text-[10px] text-on-surface-variant font-label">
                <span>The Maison</span>
                <span>Private Appointment</span>
                <span>Sourcing</span>
                <span>Legal</span>
             </div>
             <div className="text-center text-[8px] text-on-surface-variant/50 font-label uppercase tracking-widest space-y-1">
                <p>© 2024 Molvbriv.</p>
                <p>A Timeless Curator Experience.</p>
             </div>
          </div>
        </main>
      </div>
    </div>
  )
}

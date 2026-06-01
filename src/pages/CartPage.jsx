import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useCart } from '../context/CartContext'
import { supabase } from '../supabaseClient'

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
  const { cartItems, removeFromCart, updateQuantity, subtotal, clearCart, user, isLoggedIn } = useCart()
  const [savedAddresses, setSavedAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)

  const prefillAddress = (addr) => {
    if (addr.full_name) setFullName(addr.full_name);
    if (addr.phone) setPhone(addr.phone);
    if (addr.alt_phone) setAltPhone(addr.alt_phone || '');
    if (addr.flat_number) setFlatNumber(addr.flat_number);
    if (addr.street) setStreet(addr.street);
    if (addr.landmark) setLandmark(addr.landmark || '');
    if (addr.area) setArea(addr.area || '');
    if (addr.city) setCity(addr.city);
    if (addr.state) setState(addr.state);
    if (addr.pincode) setPinCode(addr.pincode);
    if (user?.email) setEmail(user.email);
  }

  // Load user saved addresses from Supabase when user resolves
  useEffect(() => {
    if (user) {
      async function loadSavedAddresses() {
        try {
          const { data, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', user.id)
            .order('is_default', { ascending: false });
          
          if (!error && data) {
            setSavedAddresses(data);
            const defaultAddr = data.find(a => a.is_default);
            if (defaultAddr) {
              setSelectedAddressId(defaultAddr.id);
              prefillAddress(defaultAddr);
            } else if (data.length > 0) {
              setSelectedAddressId(data[0].id);
              prefillAddress(data[0]);
            }
          }
        } catch (err) {
          console.warn('Failed to load saved addresses from Supabase:', err);
        }
      }
      loadSavedAddresses();
    }
  }, [user]);

  const [activeStep, setActiveStep] = useState(1)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [altPhone, setAltPhone] = useState('')
  const [flatNumber, setFlatNumber] = useState('')
  const [street, setStreet] = useState('')
  const [landmark, setLandmark] = useState('')
  const [area, setArea] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('Delhi')
  const [country, setCountry] = useState('India')
  const [pinCode, setPinCode] = useState('')
  const [saveInfo, setSaveInfo] = useState(false)
  const [newsOffers, setNewsOffers] = useState(false)
  const [billingSame, setBillingSame] = useState(true)
  const [billingEmail, setBillingEmail] = useState('')
  const [billingFullName, setBillingFullName] = useState('')
  const [billingPhone, setBillingPhone] = useState('')
  const [billingAltPhone, setBillingAltPhone] = useState('')
  const [billingFlatNumber, setBillingFlatNumber] = useState('')
  const [billingStreet, setBillingStreet] = useState('')
  const [billingLandmark, setBillingLandmark] = useState('')
  const [billingArea, setBillingArea] = useState('')
  const [billingCity, setBillingCity] = useState('')
  const [billingState, setBillingState] = useState('Delhi')
  const [billingCountry, setBillingCountry] = useState('India')
  const [billingPinCode, setBillingPinCode] = useState('')
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
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Load saved checkout information on mount
  useEffect(() => {
    try {
      const savedInfo = localStorage.getItem('molvbriv_checkout_info');
      if (savedInfo) {
        const info = JSON.parse(savedInfo);
        if (info.email) setEmail(info.email);
        if (info.fullName) setFullName(info.fullName);
        if (info.phone) setPhone(info.phone);
        if (info.altPhone) setAltPhone(info.altPhone);
        if (info.flatNumber) setFlatNumber(info.flatNumber);
        if (info.street) setStreet(info.street);
        if (info.landmark) setLandmark(info.landmark);
        if (info.area) setArea(info.area);
        if (info.city) setCity(info.city);
        if (info.state) setState(info.state);
        if (info.pinCode) setPinCode(info.pinCode);
        if (info.country) setCountry(info.country);
        
        if (info.billingSame !== undefined) setBillingSame(info.billingSame);
        if (info.billingEmail) setBillingEmail(info.billingEmail);
        if (info.billingFullName) setBillingFullName(info.billingFullName);
        if (info.billingPhone) setBillingPhone(info.billingPhone);
        if (info.billingAltPhone) setBillingAltPhone(info.billingAltPhone);
        if (info.billingFlatNumber) setBillingFlatNumber(info.billingFlatNumber);
        if (info.billingStreet) setBillingStreet(info.billingStreet);
        if (info.billingLandmark) setBillingLandmark(info.billingLandmark);
        if (info.billingArea) setBillingArea(info.billingArea);
        if (info.billingCity) setBillingCity(info.billingCity);
        if (info.billingState) setBillingState(info.billingState);
        if (info.billingPinCode) setBillingPinCode(info.billingPinCode);
        if (info.billingCountry) setBillingCountry(info.billingCountry);
        setSaveInfo(true);
      }
      
      const savedNews = localStorage.getItem('molvbriv_news_offers');
      if (savedNews === 'true') {
        setNewsOffers(true);
      }
    } catch (err) {
      console.warn('Failed to load saved checkout info from localStorage:', err);
    }
  }, []);

  // Helper to save or clear checkout information in localStorage
  const saveOrClearCheckoutInfo = () => {
    try {
      if (saveInfo) {
        const infoToSave = {
          email,
          fullName,
          phone,
          altPhone,
          flatNumber,
          street,
          landmark,
          area,
          city,
          state,
          pinCode,
          country,
          billingSame,
          billingEmail,
          billingFullName,
          billingPhone,
          billingAltPhone,
          billingFlatNumber,
          billingStreet,
          billingLandmark,
          billingArea,
          billingCity,
          billingState,
          billingPinCode,
          billingCountry
        };
        localStorage.setItem('molvbriv_checkout_info', JSON.stringify(infoToSave));
      } else {
        localStorage.removeItem('molvbriv_checkout_info');
      }

      if (newsOffers) {
        localStorage.setItem('molvbriv_news_offers', 'true');
      } else {
        localStorage.removeItem('molvbriv_news_offers');
      }
    } catch (err) {
      console.warn('Failed to save checkout info to localStorage:', err);
    }
  };

  const taxes = Math.round(subtotal * 0.08)
  const onlineDiscount = paymentMethod === 'razorpay' ? Math.round(subtotal * 0.1) : 0
  const grandTotal = Math.max(0, subtotal - discount - onlineDiscount + taxes)

  const applyCode = () => {
    if (privilegeCode.toLowerCase() === 'molvbriv10') {
      setDiscount(Math.round(subtotal * 0.1))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!email || !/\S+@\S+\.\S+/.test(email.trim())) newErrors.email = true
    if (!fullName || !fullName.trim()) newErrors.fullName = true
    if (!phone || !/^\d{10}$/.test(phone.trim())) newErrors.phone = true
    if (altPhone.trim() && !/^\d{10}$/.test(altPhone.trim())) newErrors.altPhone = true
    if (!flatNumber || !flatNumber.trim()) newErrors.flatNumber = true
    if (!street || !street.trim()) newErrors.street = true
    if (!city || !city.trim()) newErrors.city = true
    if (!state || !state.trim()) newErrors.state = true
    if (!pinCode || !/^\d{6}$/.test(pinCode.trim())) newErrors.pinCode = true
    
    if (!billingSame) {
      if (!billingEmail || !/\S+@\S+\.\S+/.test(billingEmail.trim())) newErrors.billingEmail = true
      if (!billingFullName || !billingFullName.trim()) newErrors.billingFullName = true
      if (!billingPhone || !/^\d{10}$/.test(billingPhone.trim())) newErrors.billingPhone = true
      if (billingAltPhone.trim() && !/^\d{10}$/.test(billingAltPhone.trim())) newErrors.billingAltPhone = true
      if (!billingFlatNumber || !billingFlatNumber.trim()) newErrors.billingFlatNumber = true
      if (!billingStreet || !billingStreet.trim()) newErrors.billingStreet = true
      if (!billingCity || !billingCity.trim()) newErrors.billingCity = true
      if (!billingState || !billingState.trim()) newErrors.billingState = true
      if (!billingPinCode || !/^\d{6}$/.test(billingPinCode.trim())) newErrors.billingPinCode = true
    }
    
    // Only validate Card fields if Credit Card payment method is chosen
    if (paymentMethod === 'visa') {
      if (!cardNumber || !/^\d{16}$/.test(cardNumber.trim())) newErrors.cardNumber = true
      if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry.trim())) newErrors.expiry = true
      if (!cvv || !/^\d{3}$/.test(cvv.trim())) newErrors.cvv = true
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

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const completePurchase = async () => {
    if (!validateForm()) {
      setActiveStep(activeStep > 1 ? activeStep : 1);
      return;
    }

    const billingAddressDetails = billingSame ? {
      email: email,
      fullName: fullName,
      phone: phone,
      altPhone: altPhone,
      flatNumber: flatNumber,
      street: street,
      landmark: landmark,
      area: area,
      city: city,
      state: state,
      country: country,
      pinCode: pinCode
    } : {
      email: billingEmail,
      fullName: billingFullName,
      phone: billingPhone,
      altPhone: billingAltPhone,
      flatNumber: billingFlatNumber,
      street: billingStreet,
      landmark: billingLandmark,
      area: billingArea,
      city: billingCity,
      state: billingState,
      country: billingCountry,
      pinCode: billingPinCode
    };

    const shippingAddress = {
      fullName: fullName,
      phone: phone,
      altPhone: altPhone,
      flatNumber: flatNumber,
      street: street,
      landmark: landmark,
      area: area,
      city: city,
      state: state,
      country: country,
      pinCode: pinCode,
      billingAddress: billingAddressDetails
    };

    const checkoutDetails = {
      userId: user?.id || null,
      customerName: fullName,
      customerEmail: email,
      customerPhone: phone,
      shippingAddress: shippingAddress,
      billingAddress: billingAddressDetails,
      products: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        description: item.description
      })),
      quantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      amount: grandTotal
    };

    if (paymentMethod === 'cod') {
      setIsPaymentLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/payments/cod`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkoutDetails })
        });
        
        if (!response.ok) throw new Error('API server offline');
        
        const result = await response.json();
        if (result.success) {
          saveOrClearCheckoutInfo();
          clearCart();
          navigate('/payment-success', { state: { order: result.order } });
        } else {
          throw new Error(result.error || 'Failed to place COD order');
        }
      } catch (err) {
        console.warn('Backend API offline or failed. Falling back to direct Supabase insertion for COD:', err);
        // Resilient Fallback: Insert directly into Supabase so COD order is NEVER lost!
        try {
          const orderNumber = `MB-COD-${Math.floor(Date.now() / 1000)}`;
          const { data, error } = await supabase
            .from('orders')
            .insert([{
              user_id: user?.id || null,
              customer_name: checkoutDetails.customerName,
              customer_email: checkoutDetails.customerEmail,
              customer_phone: checkoutDetails.customerPhone,
              shipping_address: checkoutDetails.shippingAddress,
              products: checkoutDetails.products,
              quantity: checkoutDetails.quantity,
              total_price: parseFloat(checkoutDetails.amount),
              total_amount: parseFloat(checkoutDetails.amount),
              razorpay_order_id: orderNumber,
              payment_id: 'COD',
              razorpay_payment_id: 'COD',
              payment_method: 'COD',
              payment_status: 'pending',
              order_status: 'Pending',
              status: 'pending'
            }])
            .select()
            .single();

          if (error) throw error;
          saveOrClearCheckoutInfo();
          clearCart();
          navigate('/payment-success', { state: { order: data } });
        } catch (dbErr) {
          console.error('Direct Supabase insert failed:', dbErr);
          alert(`Placing COD order failed. Error: ${dbErr.message || 'Unknown database error'}. Please make sure you have executed the Supabase SQL script in your Supabase dashboard SQL Editor!`);
        }
      } finally {
        setIsPaymentLoading(false);
      }
    } else {
      setIsPaymentLoading(true);
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        alert('Razorpay SDK failed to load. Please check your internet connection.');
        setIsPaymentLoading(false);
        return;
      }

      let razorpayOrder = null;
      let useBackendFlow = false;

      try {
        // Try to create order on backend
        const orderResponse = await fetch(`${API_BASE_URL}/api/payments/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: grandTotal,
            currency: 'INR',
            checkoutDetails
          })
        });
        
        if (orderResponse.ok) {
          const orderResult = await orderResponse.json();
          if (orderResult.success) {
            razorpayOrder = orderResult.razorpayOrder;
            useBackendFlow = true;
          }
        }
      } catch (err) {
        console.warn('Backend payment creation API offline. Falling back to secure client-side Razorpay flow.', err);
      }

      try {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_SsUdDbfNytrJV9',
          amount: razorpayOrder ? razorpayOrder.amount : Math.round(grandTotal * 100),
          currency: razorpayOrder ? razorpayOrder.currency : 'INR',
          name: 'MOLVBRIV',
          description: 'Timeless Luxury Jewelry Sourcing & Purchase',
          image: 'https://images.unsplash.com/photo-1515562141589-67f0d954ca94?w=200&h=200&fit=crop',
          ...(useBackendFlow && razorpayOrder ? { order_id: razorpayOrder.id } : {}), // only include order_id if backend is online
          handler: async function (response) {
            setIsPaymentLoading(true);
            
            if (useBackendFlow) {
              // A. BACKEND VERIFICATION FLOW
              try {
                const verifyResponse = await fetch(`${API_BASE_URL}/api/payments/verify`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    checkoutDetails
                  })
                });
                
                if (!verifyResponse.ok) throw new Error('Verification server offline');
                
                const verifyResult = await verifyResponse.json();
                if (verifyResult.success) {
                  saveOrClearCheckoutInfo();
                  clearCart();
                  navigate('/payment-success', { state: { order: verifyResult.order } });
                } else {
                  throw new Error(verifyResult.error || 'Payment signature mismatch');
                }
              } catch (err) {
                console.warn('Backend verification offline during transaction. Inserting paid order directly to Supabase:', err);
                try {
                  const { data, error } = await supabase
                    .from('orders')
                    .update({
                      payment_status: 'paid',
                      order_status: 'Paid',
                      status: 'processing',
                      payment_id: response.razorpay_payment_id,
                      razorpay_payment_id: response.razorpay_payment_id
                    })
                    .eq('razorpay_order_id', response.razorpay_order_id)
                    .select()
                    .single();

                  if (error) throw error;
                  saveOrClearCheckoutInfo();
                  clearCart();
                  navigate('/payment-success', { state: { order: data } });
                } catch (dbErr) {
                  console.error('Direct Supabase update failed:', dbErr);
                  navigate('/payment-failed', { state: { error: 'Payment succeeded but database syncing failed. Payment ID: ' + response.razorpay_payment_id, checkoutDetails } });
                }
              } finally {
                setIsPaymentLoading(false);
              }
            } else {
              // B. CLIENT-SIDE FLOW WITH DIRECT SUPABASE INSERT (Backup if backend is offline)
              try {
                const orderNumber = `MB-${Math.floor(Date.now() / 1000)}`;
                const { data, error } = await supabase
                  .from('orders')
                  .insert([{
                    user_id: user?.id || null,
                    customer_name: checkoutDetails.customerName,
                    customer_email: checkoutDetails.customerEmail,
                    customer_phone: checkoutDetails.customerPhone,
                    shipping_address: checkoutDetails.shippingAddress,
                    products: checkoutDetails.products,
                    quantity: checkoutDetails.quantity,
                    total_price: parseFloat(checkoutDetails.amount),
                    total_amount: parseFloat(checkoutDetails.amount),
                    razorpay_order_id: response.razorpay_order_id || orderNumber,
                    payment_id: response.razorpay_payment_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    payment_method: 'Online',
                    payment_status: 'paid',
                    order_status: 'Paid',
                    status: 'processing'
                  }])
                  .select()
                  .single();

                if (error) throw error;
                saveOrClearCheckoutInfo();
                clearCart();
                navigate('/payment-success', { state: { order: data } });
              } catch (dbErr) {
                console.error('Direct paid order insertion failed:', dbErr);
                alert(`Payment was successful (ID: ${response.razorpay_payment_id}) but we failed to sync with the database. Error: ${dbErr.message || 'Unknown database error'}. Please make sure you have executed the Supabase SQL script in your Supabase dashboard SQL Editor!`);
              } finally {
                setIsPaymentLoading(false);
              }
            }
          },
          prefill: {
            name: fullName,
            email: email,
            contact: phone
          },
          notes: {
            address: `${flatNumber}, ${street}, ${city}, ${state} - ${pinCode}`
          },
          theme: {
            color: '#1a4a35'
          },
          modal: {
            ondismiss: function () {
              setIsPaymentLoading(false);
              navigate('/payment-failed', { 
                state: { 
                  error: 'Payment dismissed by user.', 
                  checkoutDetails 
                } 
              });
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (err) {
        console.error('Failed to open Razorpay checkout:', err);
        alert('We are unable to open the payment gateway. Please check your internet connection or choose Cash on Delivery.');
        setIsPaymentLoading(false);
      }
    }
  };

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
            <section className="p-8 md:p-12 shadow-sm rounded-none" style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' }}>
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
              <h2 className="font-headline text-3xl text-primary mb-8">Delivery Details</h2>
                  
                  <div className="space-y-4">
                    {/* Saved Addresses Section for authed users */}
                    {isLoggedIn && savedAddresses.length > 0 && (
                      <div className="space-y-3 pb-6 border-b border-on-surface/5 mb-6 text-left">
                        <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Select from Saved Addresses</label>
                        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#765931]/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                          {savedAddresses.map((addr) => (
                            <div 
                              key={addr.id}
                              onClick={() => {
                                setSelectedAddressId(addr.id);
                                prefillAddress(addr);
                              }}
                              className={`p-4 rounded-sm border cursor-pointer shrink-0 w-64 text-left transition-all relative
                              ${selectedAddressId === addr.id 
                                ? 'border-[#765931] bg-[#f7f3ed]' 
                                : 'border-outline-variant/30 hover:border-[#765931]/50 bg-white'
                              }`}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[8px] font-label uppercase tracking-widest bg-primary/10 text-primary px-1.5 py-0.5 font-bold">
                                  {addr.address_type || 'Home'}
                                </span>
                                {addr.is_default && (
                                  <span className="text-[8px] text-[#765931] font-bold uppercase tracking-widest">Default</span>
                                )}
                              </div>
                              <p className="text-xs font-semibold text-primary truncate">{addr.full_name}</p>
                              <p className="text-[10px] text-on-surface-variant truncate mt-1">{addr.flat_number}, {addr.street}</p>
                              <p className="text-[10px] text-on-surface-variant truncate">{addr.city}, {addr.state} - {addr.pincode}</p>
                              <p className="text-[10px] text-primary/70 font-semibold mt-2">+91 {addr.phone}</p>
                              
                              {selectedAddressId === addr.id && (
                                <span className="material-symbols-outlined text-[16px] text-primary absolute right-3 bottom-3">check_circle</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Country/Region</label>
                        <div className="relative">
                          <select value={country} onChange={e => setCountry(e.target.value)} className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm appearance-none rounded-sm">
                            <option value="India">India</option>
                          </select>
                          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none">expand_more</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Email Address</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.email ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                        {errors.email && <p className="text-[10px] text-red-500 ml-1">Email is required</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Full Name</label>
                      <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Recipient's Name" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.fullName ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                      {errors.fullName && <p className="text-[10px] text-red-500 ml-1">Full Name is required</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Mobile Number (10 digits)</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Mobile Number" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.phone ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                        {errors.phone && <p className="text-[10px] text-red-500 ml-1">Valid 10-digit Mobile Number is required</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Alternate Number (Optional)</label>
                        <input type="tel" value={altPhone} onChange={e => setAltPhone(e.target.value)} placeholder="Alternate Number" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.altPhone ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                        {errors.altPhone && <p className="text-[10px] text-red-500 ml-1">Valid 10-digit number required</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">House/Flat Number</label>
                        <input type="text" value={flatNumber} onChange={e => setFlatNumber(e.target.value)} placeholder="e.g. A-301, 3rd Floor" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.flatNumber ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                        {errors.flatNumber && <p className="text-[10px] text-red-500 ml-1">House/Flat Number is required</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Street / Apartment Name</label>
                        <input type="text" value={street} onChange={e => setStreet(e.target.value)} placeholder="Street/Road/Apartment name" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.street ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                        {errors.street && <p className="text-[10px] text-red-500 ml-1">Street / Apartment Name is required</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Landmark (Optional)</label>
                        <input type="text" value={landmark} onChange={e => setLandmark(e.target.value)} placeholder="e.g. Near Grand Hyatt Hotel" className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Area/Sector (Optional)</label>
                        <input type="text" value={area} onChange={e => setArea(e.target.value)} placeholder="e.g. Saket, Sector 4" className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">City</label>
                        <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="City" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.city ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                        {errors.city && <p className="text-[10px] text-red-500 ml-1">City is required</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">State</label>
                        <div className="relative">
                          <select value={state} onChange={e => setState(e.target.value)} className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm appearance-none rounded-sm">
                            {INDIAN_STATES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none">expand_more</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">PIN code (6 digits)</label>
                        <input type="text" value={pinCode} onChange={e => setPinCode(e.target.value)} placeholder="PIN code" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.pinCode ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                        {errors.pinCode && <p className="text-[10px] text-red-500 ml-1">Valid 6-digit PIN is required</p>}
                      </div>
                    </div>

                    <div className="pt-2 space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer group" onClick={() => setSaveInfo(!saveInfo)}>
                        <div className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-all ${saveInfo ? 'bg-black border-black' : 'border-outline-variant/30 group-hover:border-primary/50'}`}>
                          {saveInfo && <span className="material-symbols-outlined text-white text-[16px]">check</span>}
                        </div>
                        <span className="text-sm text-on-surface-variant select-none">Save this information for next time</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer group" onClick={() => setNewsOffers(!newsOffers)}>
                        <div className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-all ${newsOffers ? 'bg-black border-black' : 'border-outline-variant/30 group-hover:border-primary/50'}`}>
                          {newsOffers && <span className="material-symbols-outlined text-white text-[16px]">check</span>}
                        </div>
                        <span className="text-sm text-on-surface-variant select-none">Text me with news and offers</span>
                      </label>
                    </div>
                  </div>
                </section>

                {/* Billing Address Selection */}
                <section className="bg-surface p-8 md:p-12 border-t border-on-surface/5 space-y-6">
                  <h3 className="font-headline text-2xl text-primary mb-4 font-semibold">Billing address</h3>
                  
                  <div className="border border-outline-variant/30 rounded-md overflow-hidden bg-white">
                    {/* Option 1: Same as shipping */}
                    <div 
                      onClick={() => setBillingSame(true)} 
                      className={`flex items-center gap-4 p-5 cursor-pointer transition-all border-b border-outline-variant/30 ${billingSame ? 'bg-[#f7f3ed]' : 'hover:bg-[#f7f3ed]/50'}`}
                    >
                      <div className="relative flex items-center justify-center">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${billingSame ? 'border-black' : 'border-outline-variant/50'}`}>
                          {billingSame && <div className="w-2.5 h-2.5 rounded-full bg-black"></div>}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-on-surface select-none">Same as shipping address</span>
                    </div>

                    {/* Option 2: Different billing address */}
                    <div 
                      onClick={() => setBillingSame(false)} 
                      className={`flex items-center gap-4 p-5 cursor-pointer transition-all ${!billingSame ? 'bg-[#f7f3ed]' : 'hover:bg-[#f7f3ed]/50'}`}
                    >
                      <div className="relative flex items-center justify-center">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${!billingSame ? 'border-black' : 'border-outline-variant/50'}`}>
                          {!billingSame && <div className="w-2.5 h-2.5 rounded-full bg-black"></div>}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-on-surface select-none">Use a different billing address</span>
                    </div>
                  </div>

                  {/* Collapsible Billing Form */}
                  {!billingSame && (
                    <div className="pt-6 space-y-4 border-t border-outline-variant/20 transition-all duration-300">
                      <h4 className="font-headline text-lg text-primary mb-4 font-semibold">Billing Details</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Country/Region</label>
                          <div className="relative">
                            <select value={billingCountry} onChange={e => setBillingCountry(e.target.value)} className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm appearance-none rounded-sm">
                              <option value="India">India</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none">expand_more</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Email Address</label>
                          <input type="email" value={billingEmail} onChange={e => setBillingEmail(e.target.value)} placeholder="Email address" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.billingEmail ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                          {errors.billingEmail && <p className="text-[10px] text-red-500 ml-1">Email is required</p>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Full Name</label>
                        <input type="text" value={billingFullName} onChange={e => setBillingFullName(e.target.value)} placeholder="Recipient's Name" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.billingFullName ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                        {errors.billingFullName && <p className="text-[10px] text-red-500 ml-1">Full Name is required</p>}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Mobile Number (10 digits)</label>
                          <input type="tel" value={billingPhone} onChange={e => setBillingPhone(e.target.value)} placeholder="Mobile Number" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.billingPhone ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                          {errors.billingPhone && <p className="text-[10px] text-red-500 ml-1">Valid 10-digit Mobile Number is required</p>}
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Alternate Number (Optional)</label>
                          <input type="tel" value={billingAltPhone} onChange={e => setBillingAltPhone(e.target.value)} placeholder="Alternate Number" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.billingAltPhone ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                          {errors.billingAltPhone && <p className="text-[10px] text-red-500 ml-1">Valid 10-digit number required</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">House/Flat Number</label>
                          <input type="text" value={billingFlatNumber} onChange={e => setBillingFlatNumber(e.target.value)} placeholder="e.g. A-301, 3rd Floor" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.billingFlatNumber ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                          {errors.billingFlatNumber && <p className="text-[10px] text-red-500 ml-1">House/Flat Number is required</p>}
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Street / Apartment Name</label>
                          <input type="text" value={billingStreet} onChange={e => setBillingStreet(e.target.value)} placeholder="Street/Road/Apartment name" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.billingStreet ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                          {errors.billingStreet && <p className="text-[10px] text-red-500 ml-1">Street / Apartment Name is required</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Landmark (Optional)</label>
                          <input type="text" value={billingLandmark} onChange={e => setBillingLandmark(e.target.value)} placeholder="e.g. Near Grand Hyatt Hotel" className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Area/Sector (Optional)</label>
                          <input type="text" value={billingArea} onChange={e => setBillingArea(e.target.value)} placeholder="e.g. Saket, Sector 4" className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">City</label>
                          <input type="text" value={billingCity} onChange={e => setBillingCity(e.target.value)} placeholder="City" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.billingCity ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                          {errors.billingCity && <p className="text-[10px] text-red-500 ml-1">City is required</p>}
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">State</label>
                          <div className="relative">
                            <select value={billingState} onChange={e => setBillingState(e.target.value)} className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm appearance-none rounded-sm">
                              {INDIAN_STATES.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none">expand_more</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">PIN code (6 digits)</label>
                          <input type="text" value={billingPinCode} onChange={e => setBillingPinCode(e.target.value)} placeholder="PIN code" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.billingPinCode ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                          {errors.billingPinCode && <p className="text-[10px] text-red-500 ml-1">Valid 6-digit PIN is required</p>}
                        </div>
                      </div>
                    </div>
                  )}
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
                        <div className="w-12 h-8 bg-[#0F1C3F] rounded-[3px] flex items-center justify-center text-white shrink-0">
                          <span className="text-[10px] font-bold tracking-tight">Razorpay</span>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                          <span className="text-sm font-semibold">Online Payment (UPI, Card, NetBanking, Wallets)</span>
                          <span className="bg-[#1a4a35] text-[#d4af37] text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-sm animate-pulse border border-[#d4af37]/30">
                            ⚡ Save 10% Instantly
                          </span>
                        </div>
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
                {onlineDiscount > 0 && (
                  <div className="flex justify-between text-[#d4af37] font-semibold border-b border-white/10 pb-3 pt-2">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs">percent</span>
                      Online Payment 10% Off
                    </span>
                    <span>-₹{onlineDiscount.toLocaleString()}.00</span>
                  </div>
                )}
                
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
                <h2 className="font-headline text-2xl text-primary mb-6">Delivery Details</h2>
                
                <div className="space-y-4">
                  {/* Saved Addresses Section for authed users */}
                  {isLoggedIn && savedAddresses.length > 0 && (
                    <div className="space-y-3 pb-6 border-b border-on-surface/5 mb-6 text-left">
                      <label className="text-[9px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Select from Saved Addresses</label>
                      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#765931]/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                        {savedAddresses.map((addr) => (
                          <div 
                            key={addr.id}
                            onClick={() => {
                              setSelectedAddressId(addr.id);
                              prefillAddress(addr);
                            }}
                            className={`p-4 rounded-sm border cursor-pointer shrink-0 w-60 text-left transition-all relative
                            ${selectedAddressId === addr.id 
                              ? 'border-[#765931] bg-[#f7f3ed]' 
                              : 'border-outline-variant/30 hover:border-[#765931]/50 bg-white'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-[8px] font-label uppercase tracking-widest bg-primary/10 text-primary px-1.5 py-0.5 font-bold">
                                {addr.address_type || 'Home'}
                              </span>
                              {addr.is_default && (
                                <span className="text-[8px] text-[#765931] font-bold uppercase tracking-widest">Default</span>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-primary truncate">{addr.full_name}</p>
                            <p className="text-[9px] text-on-surface-variant truncate mt-0.5">{addr.flat_number}, {addr.street}</p>
                            <p className="text-[9px] text-on-surface-variant truncate">{addr.city}, {addr.state} - {addr.pincode}</p>
                            <p className="text-[9px] text-primary/70 font-semibold mt-1.5">+91 {addr.phone}</p>
                            
                            {selectedAddressId === addr.id && (
                              <span className="material-symbols-outlined text-[14px] text-primary absolute right-3 bottom-3">check_circle</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[9px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Country/Region</label>
                    <div className="relative">
                      <select value={country} onChange={e => setCountry(e.target.value)} className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm appearance-none rounded-sm">
                        <option value="India">India</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none">expand_more</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Email Address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.email ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                    {errors.email && <p className="text-[10px] text-red-500 ml-1">Email is required</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Full Name</label>
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Recipient's Name" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.fullName ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                    {errors.fullName && <p className="text-[10px] text-red-500 ml-1">Full Name is required</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Mobile Number</label>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Mobile Number" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.phone ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                      {errors.phone && <p className="text-[10px] text-red-500 ml-1">Valid 10-digit Mobile Number is required</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Alternate Number</label>
                      <input type="tel" value={altPhone} onChange={e => setAltPhone(e.target.value)} placeholder="Alternate Number" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.altPhone ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                      {errors.altPhone && <p className="text-[10px] text-red-500 ml-1">Valid 10-digit number required</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">House/Flat Number</label>
                      <input type="text" value={flatNumber} onChange={e => setFlatNumber(e.target.value)} placeholder="e.g. A-301, 3rd Floor" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.flatNumber ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                      {errors.flatNumber && <p className="text-[10px] text-red-500 ml-1">House/Flat Number is required</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Street Name</label>
                      <input type="text" value={street} onChange={e => setStreet(e.target.value)} placeholder="Street/Road name" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.street ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                      {errors.street && <p className="text-[10px] text-red-500 ml-1">Street is required</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Landmark</label>
                      <input type="text" value={landmark} onChange={e => setLandmark(e.target.value)} placeholder="e.g. Near Grand Hyatt" className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Area/Sector</label>
                      <input type="text" value={area} onChange={e => setArea(e.target.value)} placeholder="e.g. Saket, Sector 4" className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">City</label>
                      <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="City" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.city ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                      {errors.city && <p className="text-[10px] text-red-500 ml-1">City is required</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">State</label>
                      <div className="relative">
                        <select value={state} onChange={e => setState(e.target.value)} className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm appearance-none rounded-sm">
                          {INDIAN_STATES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none">expand_more</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Pincode</label>
                      <input type="text" value={pinCode} onChange={e => setPinCode(e.target.value)} placeholder="Pincode" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.pinCode ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                      {errors.pinCode && <p className="text-[10px] text-red-500 ml-1">Pincode is required</p>}
                    </div>
                  </div>

                  <div className="pt-2 space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer group" onClick={() => setSaveInfo(!saveInfo)}>
                      <div className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-all ${saveInfo ? 'bg-black border-black' : 'border-outline-variant/30 group-hover:border-primary/50'}`}>
                        {saveInfo && <span className="material-symbols-outlined text-white text-[16px]">check</span>}
                      </div>
                      <span className="text-sm text-on-surface-variant select-none">Save this information for next time</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group" onClick={() => setNewsOffers(!newsOffers)}>
                      <div className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-all ${newsOffers ? 'bg-black border-black' : 'border-outline-variant/30 group-hover:border-primary/50'}`}>
                        {newsOffers && <span className="material-symbols-outlined text-white text-[16px]">check</span>}
                      </div>
                      <span className="text-sm text-on-surface-variant select-none">Text me with news and offers</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Billing Address Selection */}
              <div className="mt-12 space-y-6">
                <h2 className="font-headline text-2xl text-primary mb-6 font-semibold">Billing address</h2>
                
                <div className="border border-outline-variant/30 rounded-md overflow-hidden bg-white">
                  {/* Option 1: Same as shipping */}
                  <div 
                    onClick={() => setBillingSame(true)} 
                    className={`flex items-center gap-4 p-4 cursor-pointer transition-all border-b border-outline-variant/30 ${billingSame ? 'bg-[#f7f3ed]' : 'hover:bg-[#f7f3ed]/50'}`}
                  >
                    <div className="relative flex items-center justify-center">
                      <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all ${billingSame ? 'border-black' : 'border-outline-variant/50'}`}>
                        {billingSame && <div className="w-2 h-2 rounded-full bg-black"></div>}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-on-surface select-none">Same as shipping address</span>
                  </div>

                  {/* Option 2: Different billing address */}
                  <div 
                    onClick={() => setBillingSame(false)} 
                    className={`flex items-center gap-4 p-4 cursor-pointer transition-all ${!billingSame ? 'bg-[#f7f3ed]' : 'hover:bg-[#f7f3ed]/50'}`}
                  >
                    <div className="relative flex items-center justify-center">
                      <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all ${!billingSame ? 'border-black' : 'border-outline-variant/50'}`}>
                        {!billingSame && <div className="w-2 h-2 rounded-full bg-black"></div>}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-on-surface select-none">Use a different billing address</span>
                  </div>
                </div>

                {/* Collapsible Billing Form */}
                {!billingSame && (
                  <div className="pt-6 space-y-4 border-t border-outline-variant/20 transition-all duration-300">
                    <h4 className="font-headline text-lg text-primary mb-4 font-semibold">Billing Details</h4>
                     <div className="space-y-2">
                      <label className="text-[9px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Country/Region</label>
                      <div className="relative">
                        <select value={billingCountry} onChange={e => setBillingCountry(e.target.value)} className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm appearance-none rounded-sm">
                          <option value="India">India</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none">expand_more</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Email Address</label>
                      <input type="email" value={billingEmail} onChange={e => setBillingEmail(e.target.value)} placeholder="Email address" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.billingEmail ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                      {errors.billingEmail && <p className="text-[10px] text-red-500 ml-1">Email is required</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Full Name</label>
                      <input type="text" value={billingFullName} onChange={e => setBillingFullName(e.target.value)} placeholder="Recipient's Name" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.billingFullName ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                      {errors.billingFullName && <p className="text-[10px] text-red-500 ml-1">Full Name is required</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Mobile Number</label>
                        <input type="tel" value={billingPhone} onChange={e => setBillingPhone(e.target.value)} placeholder="Mobile Number" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.billingPhone ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                        {errors.billingPhone && <p className="text-[10px] text-red-500 ml-1">Valid 10-digit Mobile Number is required</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Alternate Number</label>
                        <input type="tel" value={billingAltPhone} onChange={e => setBillingAltPhone(e.target.value)} placeholder="Alternate Number" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.billingAltPhone ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                        {errors.billingAltPhone && <p className="text-[10px] text-red-500 ml-1">Valid 10-digit number required</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">House/Flat Number</label>
                        <input type="text" value={billingFlatNumber} onChange={e => setBillingFlatNumber(e.target.value)} placeholder="e.g. A-301, 3rd Floor" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.billingFlatNumber ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                        {errors.billingFlatNumber && <p className="text-[10px] text-red-500 ml-1">House/Flat Number is required</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Street Name</label>
                        <input type="text" value={billingStreet} onChange={e => setBillingStreet(e.target.value)} placeholder="Street/Road name" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.billingStreet ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                        {errors.billingStreet && <p className="text-[10px] text-red-500 ml-1">Street is required</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Landmark</label>
                        <input type="text" value={billingLandmark} onChange={e => setBillingLandmark(e.target.value)} placeholder="e.g. Near Grand Hyatt" className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Area/Sector</label>
                        <input type="text" value={billingArea} onChange={e => setBillingArea(e.target.value)} placeholder="e.g. Saket, Sector 4" className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">City</label>
                        <input type="text" value={billingCity} onChange={e => setBillingCity(e.target.value)} placeholder="City" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.billingCity ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                        {errors.billingCity && <p className="text-[10px] text-red-500 ml-1">City is required</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">State</label>
                        <div className="relative">
                          <select value={billingState} onChange={e => setBillingState(e.target.value)} className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm appearance-none rounded-sm">
                            {INDIAN_STATES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none">expand_more</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-label uppercase tracking-widest text-[#765931] font-bold block ml-1">Pincode</label>
                        <input type="text" value={billingPinCode} onChange={e => setBillingPinCode(e.target.value)} placeholder="Pincode" className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm placeholder:text-on-surface-variant/40 rounded-sm transition-colors ${errors.billingPinCode ? 'border-red-500' : 'border-transparent focus:border-[#765931]/30'}`} />
                        {errors.billingPinCode && <p className="text-[10px] text-red-500 ml-1">Pincode is required</p>}
                      </div>
                    </div>
                  </div>
                )}
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
                    <div className={`flex flex-col gap-2 ${paymentMethod === 'razorpay' ? '' : 'opacity-50'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-6 bg-[#0F1C3F] rounded-[2.5px] flex items-center justify-center text-white shrink-0">
                          <span className="text-[9px] font-bold tracking-tight">Razorpay</span>
                        </div>
                        <span className="text-sm font-semibold">Online Payment (UPI, Cards, Wallets)</span>
                      </div>
                      <div className="self-start">
                        <span className="bg-[#1a4a35] text-[#d4af37] text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-sm border border-[#d4af37]/30">
                          ⚡ 10% Instant Discount Applied
                        </span>
                      </div>
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
              {onlineDiscount > 0 && (
                <div className="flex justify-between text-[#d4af37] font-semibold text-sm border-b border-white/10 pb-3 pt-2">
                  <span>Online Payment 10% Off</span>
                  <span>-₹{onlineDiscount.toLocaleString()}.00</span>
                </div>
              )}
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

      {/* Premium Authentication Modal Overlay */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-all duration-300">
          <div className="relative w-full max-w-[480px] bg-[#082717] border border-[#d4af37]/30 p-8 md:p-10 shadow-2xl rounded-sm text-center space-y-8" style={{ backgroundImage: 'radial-gradient(circle at top, rgba(212,175,55,0.08) 0%, transparent 70%)' }}>
            {/* Close Button */}
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute right-6 top-6 text-white/50 hover:text-white transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            {/* Glowing Icon Container */}
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 bg-[#d4af37]/10 rounded-full blur-md animate-pulse"></div>
              <div className="relative w-20 h-20 rounded-full border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] bg-[#051c10]">
                <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>lock</span>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-3">
              <span className="text-[10px] font-label uppercase tracking-[0.3em] text-[#d4af37] font-semibold block">Secure Checkout Protocol</span>
              <h3 className="font-headline text-2xl md:text-3xl text-white font-bold tracking-tight">Authentication Required</h3>
              <div className="h-px w-12 bg-[#d4af37]/30 mx-auto my-4"></div>
              <p className="text-xs md:text-sm text-white/70 max-w-sm mx-auto leading-relaxed">
                To complete your boutique order and secure your timeless luxury jewelry, please sign in or create a private account first.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-4 pt-2">
              <Link 
                to="/login?redirect=cart" 
                className="w-full inline-block bg-[#765931] hover:bg-[#d4af37] text-white hover:text-[#082717] py-4.5 font-label uppercase tracking-[0.25em] text-[10px] font-extrabold transition-all duration-300 shadow-lg border border-[#765931] hover:border-[#d4af37]"
              >
                Login or Create Account
              </Link>
              
              <button 
                onClick={() => setShowAuthModal(false)}
                className="w-full bg-transparent hover:bg-white/5 text-white/60 hover:text-white py-3.5 font-label uppercase tracking-[0.2em] text-[9px] font-bold transition-all border border-white/10"
              >
                Return to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

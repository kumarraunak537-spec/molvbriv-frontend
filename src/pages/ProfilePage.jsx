import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useCart } from '../context/CartContext'
import { supabase } from '../supabaseClient'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'https://molvbriv-frontend.onrender.com';

const INDIAN_STATES = [
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

export default function ProfilePage() {
  const navigate = useNavigate()
  const { isLoggedIn, user, isSessionLoaded, toggleWishlist, addToCart, setGlobalProfile } = useCart()
  
  const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard', 'orders', 'wishlist', 'addresses', 'settings'
  const [profileData, setProfileData] = useState(null)
  const [orders, setOrders] = useState([])
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [wishlistProducts, setWishlistProducts] = useState([])
  const [addresses, setAddresses] = useState([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [isWlLoading, setIsWlLoading] = useState(false)
  const [isAddrLoading, setIsAddrLoading] = useState(false)
  
  // Inline Edit Profile Form State
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editError, setEditError] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Settings Form
  const [settingsAvatar, setSettingsAvatar] = useState('')
  const [settingsMsg, setSettingsMsg] = useState({ text: '', type: '' })
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  // Address Dialog Modal
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null) // null for add, address object for edit
  const [addrForm, setAddrForm] = useState({
    address_type: 'Home',
    full_name: '',
    phone: '',
    alt_phone: '',
    flat_number: '',
    street: '',
    landmark: '',
    area: '',
    city: '',
    state: '',
    pincode: '',
    is_default: false
  })
  const [addrErrors, setAddrErrors] = useState({})
  const [isAddrSaving, setIsAddrSaving] = useState(false)

  useEffect(() => {
    if (isSessionLoaded && !isLoggedIn && !isLoading) {
      navigate('/login?redirect=profile')
    }
  }, [isLoggedIn, isSessionLoaded, isLoading, navigate])

  // Initial Data Fetch
  useEffect(() => {
    if (isSessionLoaded && !user) {
      setIsLoading(false)
      return
    }
    if (!user) return

    async function loadData() {
      setIsLoading(true)
      try {
        // 1. Fetch Profile info
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (!profErr && prof) {
          setProfileData(prof)
          setSettingsAvatar(prof.avatar_url || '')
          setEditName(prof.name || '')
          setEditEmail(prof.email || user.email || '')
          setEditPhone(prof.phone || '')
        }

        // 2. Fetch Orders history
        const { data: ords, error: ordErr } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        if (!ordErr && ords) {
          setOrders(ords)
        }

        // 3. Load Addresses & Wishlist items
        await Promise.all([fetchAddresses(), fetchWishlistProducts()])
      } catch (err) {
        console.error('Failed to load profile dashboard archives:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user, isSessionLoaded])

  const fetchAddresses = async () => {
    if (!user) return
    setIsAddrLoading(true)
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setAddresses(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsAddrLoading(false)
    }
  }

  const fetchWishlistProducts = async () => {
    if (!user) return
    setIsWlLoading(true)
    try {
      let productIds = []
      
      // 1. Fetch wishlist_id and active item IDs from Supabase
      const { data: wlData, error: wlErr } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (!wlErr && wlData) {
        const { data: items, error: itemsErr } = await supabase
          .from('wishlist_items')
          .select('product_id')
          .eq('wishlist_id', wlData.id)
        
        if (!itemsErr && items) {
          productIds = items.map(i => i.product_id).filter(Boolean)
        }
      } else {
        // Fallback to localStorage if Supabase wishlist tables do not exist
        const localWl = localStorage.getItem(`molvbriv_wishlist_${user.id}`)
        if (localWl) {
          productIds = JSON.parse(localWl).filter(Boolean)
        }
      }

      // 2. Fetch full product information directly for those IDs
      if (productIds.length > 0) {
        const { data: prods, error: prodsErr } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds)
        
        if (!prodsErr && prods) {
          setWishlistProducts(prods)
        } else {
          setWishlistProducts([])
        }
      } else {
        setWishlistProducts([])
      }
    } catch (err) {
      console.warn('Failed to load wishlist products from database:', err)
      // Ultimate local fallback
      try {
        const localWl = localStorage.getItem(`molvbriv_wishlist_${user.id}`)
        if (localWl) {
          const productIds = JSON.parse(localWl).filter(Boolean)
          if (productIds.length > 0) {
            const { data: prods } = await supabase
              .from('products')
              .select('*')
              .in('id', productIds)
            if (prods) setWishlistProducts(prods)
          }
        }
      } catch (localErr) {
        console.error('Failed to load from local storage fallback:', localErr)
      }
    } finally {
      setIsWlLoading(false)
    }
  }

  // Address Actions
  const openAddressModal = (address = null) => {
    setAddrErrors({})
    if (address) {
      setEditingAddress(address)
      setAddrForm({
        address_type: address.address_type || 'Home',
        full_name: address.full_name || '',
        phone: address.phone || '',
        alt_phone: address.alt_phone || '',
        flat_number: address.flat_number || '',
        street: address.street || '',
        landmark: address.landmark || '',
        area: address.area || '',
        city: address.city || '',
        state: address.state || 'Delhi',
        pincode: address.pincode || '',
        is_default: address.is_default || false
      })
    } else {
      setEditingAddress(null)
      setAddrForm({
        address_type: 'Home',
        full_name: '',
        phone: '',
        alt_phone: '',
        flat_number: '',
        street: '',
        landmark: '',
        area: '',
        city: '',
        state: '',
        pincode: '',
        is_default: addresses.length === 0 // Default to true if it is their first address
      })
    }
    setIsAddressModalOpen(true)
  }

  const validateAddrForm = () => {
    const errs = {}
    if (!addrForm.full_name.trim()) errs.full_name = 'Name is required'
    if (!addrForm.phone.trim() || !/^\d{10}$/.test(addrForm.phone.trim())) errs.phone = 'Valid 10-digit number required'
    if (addrForm.alt_phone.trim() && !/^\d{10}$/.test(addrForm.alt_phone.trim())) errs.alt_phone = 'Must be 10 digits'
    if (!addrForm.flat_number.trim()) errs.flat_number = 'House/flat number is required'
    if (!addrForm.street.trim()) errs.street = 'Street details required'
    if (!addrForm.city.trim()) errs.city = 'City is required'
    if (!addrForm.pincode.trim() || !/^\d{6}$/.test(addrForm.pincode.trim())) errs.pincode = 'Valid 6-digit pin code required'
    
    setAddrErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSaveAddress = async (e) => {
    e.preventDefault()
    if (!validateAddrForm()) return
    
    setIsAddrSaving(true)
    try {
      const payload = {
        user_id: user.id,
        address_type: addrForm.address_type,
        full_name: addrForm.full_name.trim(),
        phone: addrForm.phone.trim(),
        alt_phone: addrForm.alt_phone.trim() || null,
        flat_number: addrForm.flat_number.trim(),
        street: addrForm.street.trim(),
        landmark: addrForm.landmark.trim() || null,
        area: addrForm.area.trim() || null,
        city: addrForm.city.trim(),
        state: addrForm.state,
        pincode: addrForm.pincode.trim(),
        is_default: addrForm.is_default
      }

      if (editingAddress) {
        // UPDATE
        const { error } = await supabase
          .from('addresses')
          .update(payload)
          .eq('id', editingAddress.id)
        if (error) throw error
      } else {
        // INSERT
        const { error } = await supabase
          .from('addresses')
          .insert([payload])
        if (error) throw error
      }
      
      setIsAddressModalOpen(false)
      await fetchAddresses()
    } catch (err) {
      alert(err.message || 'Failed to save address details.')
    } finally {
      setIsAddrSaving(false)
    }
  }

  const handleDeleteAddress = async (addressId) => {
    if (!confirm('Are you sure you want to delete this address?')) return
    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId)
      if (error) throw error
      await fetchAddresses()
    } catch (err) {
      alert(err.message || 'Failed to delete address.')
    }
  }

  const handleSetDefaultAddress = async (address) => {
    try {
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', address.id)
      
      if (error) throw error
      await fetchAddresses()
    } catch (err) {
      alert(err.message || 'Failed to set default address.')
    }
  }

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

  // Wishlist Actions
  const handleMoveToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.title,
      price: product.price,
      compare_price: product.compare_price,
      image: (product.images && product.images[0]) || 'https://images.unsplash.com/photo-1515562141589-67f0d954ca94?w=600&h=700&fit=crop',
      description: product.description || ''
    })
    toggleWishlist(product.id) // Remove from database wishlist
    setWishlistProducts(prev => prev.filter(p => p.id !== product.id))
  }

  const handleRemoveFromWishlist = (productId) => {
    toggleWishlist(productId)
    setWishlistProducts(prev => prev.filter(p => p.id !== productId))
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return parts[0][0].toUpperCase()
  }

  const renderAvatar = () => {
    const activeAvatar = settingsAvatar || profileData?.avatar_url || user?.user_metadata?.avatar_url
    if (activeAvatar) {
      return (
        <img 
          src={activeAvatar} 
          alt="Profile avatar" 
          className="w-full h-full object-cover rounded-full animate-fadeIn" 
          onError={(e) => { e.target.onerror = null; e.target.src = ''; }}
        />
      )
    }
    const initials = getInitials(profileData?.name || user?.user_metadata?.full_name || user?.email)
    return (
      <div 
        className="w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br from-[#1a4a35] via-[#0f2c1f] to-[#081811] text-[#d4af37] border border-[#d4af37]/30 font-headline font-bold text-lg select-none shadow-md shadow-black/10 animate-fadeIn"
        style={{ letterSpacing: '0.05em' }}
      >
        {initials}
      </div>
    )
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setEditError('')

    if (!editName.trim()) {
      setEditError('Full Name is required')
      return
    }
    if (!editEmail.trim() || !/\S+@\S+\.\S+/.test(editEmail.trim())) {
      setEditError('Valid email address is required')
      return
    }
    if (editPhone.trim() && !/^\d{10}$/.test(editPhone.trim())) {
      setEditError('Valid 10-digit phone number is required')
      return
    }

    setIsSavingProfile(true)
    try {
      // 1. Update profiles table
      const { error: profErr } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: editName.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim() || null
        })

      if (profErr) throw profErr

      // 2. Update Auth metadata
      const updateData = {
        data: {
          full_name: editName.trim(),
          phone: editPhone.trim() || null
        }
      }

      if (editEmail.trim() !== user.email) {
        updateData.email = editEmail.trim()
      }

      const { error: authErr } = await supabase.auth.updateUser(updateData)
      if (authErr) throw authErr

      // 3. Immediately refresh state
      const { data: updatedProf, error: getErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!getErr && updatedProf) {
        setProfileData(updatedProf)
        setSettingsAvatar(updatedProf.avatar_url || '')
        setEditName(updatedProf.name || '')
        setEditEmail(updatedProf.email || user.email || '')
        setEditPhone(updatedProf.phone || '')
      }

      setIsEditingProfile(false)
      alert('Profile details updated successfully!')
    } catch (err) {
      setEditError(err.message || 'An error occurred while updating your profile.')
    } finally {
      setIsSavingProfile(false)
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

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setSettingsMsg({ text: 'Please upload a valid image file (JPG, PNG, WEBP).', type: 'error' })
      return
    }

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setSettingsMsg({ text: 'Image size exceeds 2MB limit. Please choose a smaller file.', type: 'error' })
      return
    }

    setIsUploadingAvatar(true)
    setSettingsMsg({ text: 'Uploading profile photo...', type: 'success' })

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadErr) throw uploadErr

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      if (data && data.publicUrl) {
        setSettingsAvatar(data.publicUrl)
        setSettingsMsg({ text: 'Profile photo uploaded successfully. Syncing globally...', type: 'success' })
        
        // Instant global sync
        await supabase.auth.updateUser({
          data: { avatar_url: data.publicUrl }
        })
        await supabase
          .from('profiles')
          .update({ avatar_url: data.publicUrl })
          .eq('id', user.id)
          
        setProfileData(prev => ({ ...prev, avatar_url: data.publicUrl }))
        if (setGlobalProfile) {
          setGlobalProfile(prev => ({ ...prev, avatar_url: data.publicUrl }))
        }
        setSettingsMsg({ text: 'Profile photo uploaded and synced globally!', type: 'success' })
      }
    } catch (err) {
      setSettingsMsg({ text: err.message || 'Failed to upload image.', type: 'error' })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const trackingSteps = ['Placed', 'Paid', 'Processing', 'Shipped', 'Delivered']

  return (
    <div className="bg-background font-body text-on-surface min-h-screen antialiased flex flex-col selection:bg-secondary-container">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 px-4 md:px-12 max-w-7xl mx-auto w-full">
        {isLoading || !isSessionLoaded ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-3 bg-surface p-6 border border-outline-variant/10 flex flex-col gap-6 shadow-sm">
              <div className="flex items-center gap-4 border-b border-on-surface/5 pb-6">
                <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border border-[#765931]/20 flex items-center justify-center relative">
                  {renderAvatar()}
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-headline font-semibold text-lg text-primary truncate" title={profileData?.name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Client Patron')}>
                    {profileData?.name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Client Patron')}
                  </h3>
                  <span className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-semibold">Molvbriv Member</span>
                </div>
              </div>

              <nav className="flex flex-col gap-1">
                {[
                  { id: 'dashboard', label: 'Account Details', icon: 'dashboard' },
                  { id: 'orders', label: 'Order History', icon: 'history', count: orders.length },
                  { id: 'wishlist', label: 'My Wishlist', icon: 'favorite', count: wishlistProducts.length },
                  { id: 'addresses', label: 'Saved Addresses', icon: 'location_on', count: addresses.length }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-between p-3.5 text-xs font-label uppercase tracking-widest transition-all rounded-sm text-left
                    ${activeTab === tab.id 
                      ? 'bg-primary text-white font-bold' 
                      : 'text-on-surface-variant hover:bg-[#f7f3ed] hover:text-primary'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                      {tab.label}
                    </span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold
                      ${activeTab === tab.id ? 'bg-white text-primary' : 'bg-primary/10 text-primary'}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </aside>

            {/* Main Tabs Display Area */}
            <section className="lg:col-span-9 bg-surface p-6 md:p-10 border border-outline-variant/10 shadow-sm min-h-[500px]">
              
              {/* TAB 1: DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="space-y-10 animate-fadeIn">
                  <div className="border-b border-on-surface/5 pb-6">
                    <span className="text-secondary tracking-[0.25em] uppercase text-[9px] font-bold block mb-1">Overview</span>
                    <h2 className="font-headline text-3xl text-primary font-bold">Account Details</h2>
                  </div>

                  {/* Profile Photo Section */}
                  <div className="bg-[#fdfbf7] border border-[#765931]/10 p-8 rounded-sm space-y-6">
                    <h3 className="font-headline text-xl text-primary font-bold border-b border-[#765931]/10 pb-4">Profile Photo</h3>
                    {settingsMsg.text && (
                      <div className={`p-4 rounded-sm text-xs font-semibold text-center border
                      ${settingsMsg.type === 'success' ? 'bg-[#1a4a35]/5 border-[#1a4a35]/20 text-[#1a4a35]' : 'bg-red-50 border-red-200 text-red-600'}
                      `}>
                        {settingsMsg.text}
                      </div>
                    )}
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-full overflow-hidden border border-[#765931]/20 flex items-center justify-center bg-white shrink-0 relative group shadow-sm">
                        {settingsAvatar ? (
                          <img src={settingsAvatar} alt="Profile preview" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">person</span>
                        )}
                        {isUploadingAvatar && (
                          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <label className={`inline-flex items-center justify-center px-6 py-3 text-[10px] font-label uppercase tracking-widest font-bold border rounded-sm transition-colors cursor-pointer ${isUploadingAvatar ? 'opacity-50 cursor-not-allowed bg-black/5 border-black/10 text-black/40' : 'border-[#765931]/50 text-[#765931] hover:bg-[#765931] hover:border-[#765931] hover:text-white'}`}>
                          {isUploadingAvatar ? 'Uploading...' : 'Upload New Photo'}
                          <input 
                            type="file" 
                            accept="image/jpeg, image/jpg, image/png, image/webp" 
                            onChange={handleAvatarUpload} 
                            className="hidden" 
                            disabled={isUploadingAvatar}
                          />
                        </label>
                        <p className="text-[10px] text-on-surface-variant leading-relaxed">Supported formats: JPG, PNG, WEBP. Max file size: 2MB.</p>
                      </div>
                    </div>
                  </div>

                  {isEditingProfile ? (
                    <div className="bg-[#fdfbf7] border border-[#765931]/10 p-8 rounded-sm space-y-6">
                      <div className="flex justify-between items-center border-b border-[#765931]/10 pb-4">
                        <h3 className="font-headline text-xl text-primary font-bold">Account Details</h3>
                        <span className="text-[9px] font-label uppercase tracking-widest text-secondary font-bold">Editing Profile</span>
                      </div>

                      {editError && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-sm">
                          {editError}
                        </div>
                      )}

                      <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant font-semibold ml-1">Full Name</label>
                            <input 
                              type="text"
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              placeholder="Full Name"
                              className="w-full bg-[#f7f3ed] p-4 border border-[#765931]/20 focus:border-[#765931] outline-none text-sm rounded-sm transition-colors text-primary font-medium"
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant font-semibold ml-1">Email Address</label>
                            <input 
                              type="email"
                              value={editEmail}
                              onChange={e => setEditEmail(e.target.value)}
                              placeholder="Email Address"
                              className="w-full bg-[#f7f3ed] p-4 border border-[#765931]/20 focus:border-[#765931] outline-none text-sm rounded-sm transition-colors text-primary font-medium"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant font-semibold ml-1">Phone Number</label>
                            <input 
                              type="tel"
                              value={editPhone}
                              onChange={e => setEditPhone(e.target.value)}
                              placeholder="Phone Number (10 digits)"
                              className="w-full bg-[#f7f3ed] p-4 border border-[#765931]/20 focus:border-[#765931] outline-none text-sm rounded-sm transition-colors text-primary font-medium"
                            />
                          </div>

                          <div className="space-y-2 flex flex-col justify-end">
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEditingProfile(false)
                                  setEditError('')
                                }}
                                className="flex-1 bg-transparent border border-outline-variant/30 text-on-surface py-3.5 px-4 text-[10px] font-label uppercase tracking-widest font-bold transition-all text-center"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={isSavingProfile}
                                className="flex-1 bg-primary hover:bg-[#082717] text-white py-3.5 px-4 text-[10px] font-label uppercase tracking-widest font-bold transition-colors text-center"
                              >
                                {isSavingProfile ? 'Saving...' : 'Save Details'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="bg-[#fdfbf7] border border-[#765931]/10 p-8 rounded-sm space-y-6">
                      <div className="flex justify-between items-center border-b border-[#765931]/10 pb-4">
                        <h3 className="font-headline text-xl text-primary font-bold">Account Details</h3>
                        <button 
                          onClick={() => {
                            setIsEditingProfile(true)
                            setEditName(profileData?.name || '')
                            setEditEmail(profileData?.email || user?.email || '')
                            setEditPhone(profileData?.phone || '')
                            setEditError('')
                          }}
                          className="border border-[#765931]/30 hover:border-[#765931] text-[#765931] py-2 px-4 text-[9px] font-label uppercase tracking-widest font-bold transition-all flex items-center gap-1.5 rounded-sm"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                          Edit Profile
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 font-semibold">Full Name</p>
                          <p className="text-primary font-medium">{profileData?.name || 'Not Specified'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 font-semibold">Registered Email</p>
                          <p className="text-primary font-medium">{profileData?.email || user?.email}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 font-semibold">Phone Number</p>
                          <p className="text-primary font-medium">{profileData?.phone || 'Not Specified'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 font-semibold">Account Status</p>
                          <p className="text-primary font-semibold text-[#1a4a35]">Active VIP Client</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 font-semibold">Member Since</p>
                          <p className="text-primary font-medium">{profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' }) : 'Unknown'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ORDER HISTORY */}
              {activeTab === 'orders' && (
                <div className="space-y-8 animate-fadeIn">
                  <div className="border-b border-on-surface/5 pb-6">
                    <span className="text-secondary tracking-[0.25em] uppercase text-[9px] font-bold block mb-1">Archive</span>
                    <h2 className="font-headline text-3xl text-primary font-bold">Order History</h2>
                  </div>

                  {orders.length === 0 ? (
                    <div className="text-center py-16 bg-[#faf8f5] border border-black/5 rounded-sm space-y-6">
                      <p className="font-headline text-xl text-on-surface-variant italic font-light">No order records found</p>
                      <Link to="/collections" className="inline-block bg-primary text-white font-label uppercase tracking-widest text-[9px] px-6 py-4 hover:bg-[#082717] transition-all font-bold">
                        Explore Collections
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {orders.map((order) => {
                        const currentStep = getStatusStep(order.order_status)
                        const isCancelled = currentStep === -1
                        const isReturned = currentStep === -2

                        return (
                          <div 
                            key={order.id} 
                            className="p-6 md:p-8 bg-[#faf8f5] border border-outline-variant/10 rounded-sm space-y-6"
                          >
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-on-surface/5 gap-4">
                              <div>
                                <div className="flex items-center gap-3">
                                  <span className="font-headline text-md text-primary font-bold">ID: {order.razorpay_order_id || order.id?.substring(0, 13)}</span>
                                  {isCancelled && <span className="bg-red-500/10 text-red-600 text-[8px] font-label uppercase tracking-widest px-2 py-0.5 font-bold">Cancelled</span>}
                                  {isReturned && <span className="bg-orange-500/10 text-orange-600 text-[8px] font-label uppercase tracking-widest px-2 py-0.5 font-bold">Returned</span>}
                                </div>
                                <p className="text-[9px] text-on-surface-variant uppercase tracking-widest mt-1">Placed on: {new Date(order.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                              </div>

                              <div className="text-left md:text-right">
                                <p className="text-[8px] uppercase tracking-widest text-on-surface-variant">Boutique Total</p>
                                <p className="font-headline text-lg text-primary font-bold">₹{parseFloat(order.total_amount || order.total_price || 0).toLocaleString()}.00</p>
                              </div>
                            </div>

                            <div className="space-y-4">
                              {order.products && Array.isArray(order.products) && order.products.map((prod, idx) => (
                                <div key={idx} className="flex gap-4 items-center">
                                  <div className="w-12 h-16 bg-surface-container overflow-hidden shrink-0 border border-black/5">
                                    <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                      <h4 className="font-headline text-sm text-primary font-semibold">{prod.name}</h4>
                                      <span className="font-headline text-xs font-semibold">₹{parseFloat(prod.price * prod.quantity).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-[9px] font-label uppercase tracking-widest text-on-surface-variant">
                                      <span>Qty: {String(prod.quantity).padStart(2, '0')}</span>
                                      <span>•</span>
                                      <span>Rate: ₹{parseFloat(prod.price).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {!isCancelled && !isReturned && (
                              <div className="pt-4 border-t border-on-surface/5 space-y-4">
                                <div className="flex justify-between items-center">
                                  <span className="font-label text-[9px] uppercase tracking-widest font-bold text-primary">Courier Status</span>
                                  <span className="bg-[#1a4a35]/10 text-primary text-[8px] font-label uppercase tracking-widest px-2 py-0.5 font-bold">
                                    {order.order_status || 'Pending'}
                                  </span>
                                </div>

                                <div className="relative pt-2">
                                  <div className="absolute top-[13px] left-0 right-0 h-[1.5px] bg-black/5 -z-10"></div>
                                  <div 
                                    className="absolute top-[13px] left-0 h-[1.5px] bg-primary -z-10 transition-all duration-[800ms]" 
                                    style={{ width: `${(currentStep / 4) * 100}%` }}
                                  ></div>

                                  <div className="flex justify-between items-center text-center">
                                    {trackingSteps.map((step, sIdx) => {
                                      const isCompleted = currentStep >= sIdx
                                      const isCurrent = currentStep === sIdx

                                      return (
                                        <div key={sIdx} className="flex flex-col items-center">
                                          <div 
                                            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border text-[8px] transition-all duration-300
                                            ${isCompleted ? 'bg-primary border-primary text-white' : 'bg-[#faf8f5] border-black/10 text-black/30'}
                                            ${isCurrent ? 'scale-110 shadow-sm ring-2 ring-primary/10' : ''}
                                            `}
                                          >
                                            {isCompleted && <span className="material-symbols-outlined text-[8px] font-bold">check</span>}
                                          </div>
                                          <span className={`text-[8px] font-label uppercase tracking-wider mt-1 font-semibold block
                                            ${isCompleted ? 'text-primary' : 'text-on-surface-variant/40'}
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

                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-on-surface/5 gap-3">
                              <div className="text-[10px] text-on-surface-variant space-y-0.5">
                                <p>Method: <span className="font-semibold text-primary">{order.payment_method}</span></p>
                                <p>Status: <span className="font-semibold text-primary">{order.payment_status}</span></p>
                              </div>

                              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto justify-end font-semibold">
                                {/* Cancel Order Button */}
                                {!isCancelled && !isReturned && ['pending', 'paid', 'processing'].includes(order.order_status?.toLowerCase()) && (
                                  <button
                                    onClick={() => handleCancelOrder(order.id)}
                                    disabled={actionLoadingId === order.id}
                                    className="w-full sm:w-auto bg-red-600/10 text-red-600 font-label uppercase tracking-widest text-[8px] px-5 py-3 hover:bg-red-600 hover:text-white transition-all font-bold text-center disabled:opacity-50"
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
                                    className={`w-full sm:w-auto font-label uppercase tracking-widest text-[8px] px-5 py-3 transition-all font-bold text-center disabled:opacity-50
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
                                  className="w-full sm:w-auto inline-block border border-primary/30 text-primary font-label uppercase tracking-widest text-[8px] px-5 py-3 hover:border-primary transition-all font-bold text-center"
                                >
                                  Track Sourcing Route
                                </Link>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: WISHLIST */}
              {activeTab === 'wishlist' && (
                <div className="space-y-8 animate-fadeIn">
                  <div className="border-b border-on-surface/5 pb-6">
                    <span className="text-secondary tracking-[0.25em] uppercase text-[9px] font-bold block mb-1">Bespoke Collection</span>
                    <h2 className="font-headline text-3xl text-primary font-bold">My Wishlist</h2>
                  </div>

                  {isWlLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 space-y-3">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-[9px] uppercase tracking-widest text-on-surface-variant">Fetching wishlisted pieces...</p>
                    </div>
                  ) : wishlistProducts.length === 0 ? (
                    <div className="text-center py-16 bg-[#faf8f5] border border-black/5 rounded-sm space-y-6">
                      <p className="font-headline text-xl text-on-surface-variant italic font-light">No pieces saved yet</p>
                      <Link to="/collections" className="inline-block bg-primary text-white font-label uppercase tracking-widest text-[9px] px-6 py-4 hover:bg-[#082717] transition-all font-bold">
                        Browse Boutique
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {wishlistProducts.map((product) => (
                        <div key={product.id} className="group bg-[#faf8f5] border border-outline-variant/10 p-4 rounded-sm flex flex-col justify-between">
                          <div>
                            <div className="relative overflow-hidden mb-4 bg-surface-container-low aspect-[3/4]">
                              <img 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                alt={product.title} 
                                src={(product.images && product.images[0]) || 'https://images.unsplash.com/photo-1515562141589-67f0d954ca94?w=600&h=700&fit=crop'}
                              />
                              <button 
                                onClick={() => handleRemoveFromWishlist(product.id)}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-red-500 hover:bg-white hover:scale-110 transition-all border border-black/5"
                              >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                              </button>
                            </div>
                            <h4 className="font-headline text-sm text-primary font-semibold text-center mb-1">{product.title}</h4>
                            <p className="text-secondary font-manrope text-sm font-semibold text-center mb-4">₹{product.price.toLocaleString()}</p>
                          </div>
                          <button
                            onClick={() => handleMoveToCart(product)}
                            className="w-full py-3 bg-[#765931] text-white hover:bg-[#082717] text-[8px] font-label uppercase tracking-widest transition-colors font-bold"
                          >
                            Move to selection
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SAVED ADDRESSES */}
              {activeTab === 'addresses' && (
                <div className="space-y-8 animate-fadeIn">
                  <div className="border-b border-on-surface/5 pb-6 flex justify-between items-end">
                    <div>
                      <span className="text-secondary tracking-[0.25em] uppercase text-[9px] font-bold block mb-1">Logistics</span>
                      <h2 className="font-headline text-3xl text-primary font-bold">Saved Addresses</h2>
                    </div>
                    <button 
                      onClick={() => openAddressModal()}
                      className="bg-[#765931] hover:bg-[#082717] text-white py-3 px-5 text-[9px] font-label uppercase tracking-widest font-bold rounded-sm transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-xs">add</span>
                      Add Address
                    </button>
                  </div>

                  {isAddrLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 space-y-3">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-[9px] uppercase tracking-widest text-on-surface-variant">Retrieving address book...</p>
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-16 bg-[#faf8f5] border border-black/5 rounded-sm space-y-4">
                      <p className="font-headline text-xl text-on-surface-variant italic font-light">No saved addresses found</p>
                      <button 
                        onClick={() => openAddressModal()}
                        className="inline-block bg-primary text-white font-label uppercase tracking-widest text-[9px] px-6 py-4 hover:bg-[#082717] transition-all font-bold"
                      >
                        Add New Address
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {addresses.map((address) => (
                        <div 
                          key={address.id} 
                          className={`p-6 bg-[#faf8f5] border rounded-sm flex flex-col justify-between space-y-6 transition-all
                          ${address.is_default ? 'border-[#765931]/60 shadow-[0_4px_12px_rgba(118,89,49,0.08)]' : 'border-outline-variant/10'}
                          `}
                        >
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <span className="bg-[#1a4a35]/15 text-primary text-[8px] font-label uppercase tracking-widest px-2.5 py-0.5 font-bold">
                                {address.address_type || 'Home'}
                              </span>
                              {address.is_default && (
                                <span className="bg-[#765931] text-white text-[8px] font-label uppercase tracking-widest px-2 py-0.5 font-bold rounded-sm">
                                  Default
                                </span>
                              )}
                            </div>
                            <h4 className="font-headline text-sm text-primary font-bold">{address.full_name}</h4>
                            <div className="text-xs text-on-surface-variant mt-2 leading-relaxed space-y-1">
                              <p>{address.flat_number}, {address.street}</p>
                              {address.landmark && <p>Landmark: {address.landmark}</p>}
                              {address.area && <p>Area: {address.area}</p>}
                              <p>{address.city}, {address.state} - {address.pincode}</p>
                              <p className="font-medium text-primary pt-2">Phone: +91 {address.phone}</p>
                              {address.alt_phone && <p className="text-[10px]">Alternate: +91 {address.alt_phone}</p>}
                            </div>
                          </div>

                          <div className="border-t border-on-surface/5 pt-4 flex gap-4 text-[9px] font-label uppercase tracking-widest font-bold">
                            <button onClick={() => openAddressModal(address)} className="text-[#765931] hover:underline">Edit</button>
                            <button onClick={() => handleDeleteAddress(address.id)} className="text-red-500 hover:underline">Delete</button>
                            {!address.is_default && (
                              <button onClick={() => handleSetDefaultAddress(address)} className="text-primary hover:underline ml-auto">Set as Default</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}


            </section>

          </div>
        )}
      </main>

      <Footer />

      {/* Pop-up Address Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#fdfbf7] border border-[#765931]/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-10 space-y-8 rounded-sm">
            <div className="flex justify-between items-center border-b border-[#765931]/10 pb-4">
              <h3 className="font-headline text-2xl text-primary font-bold">
                {editingAddress ? 'Modify Address details' : 'Add New Address'}
              </h3>
              <button 
                onClick={() => setIsAddressModalOpen(false)}
                className="text-on-surface hover:text-[#765931] transition-colors cursor-pointer flex items-center"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-semibold ml-1">Address Label/Type</label>
                  <select 
                    value={addrForm.address_type} 
                    onChange={e => setAddrForm(prev => ({ ...prev, address_type: e.target.value }))}
                    className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm rounded-sm"
                  >
                    <option value="Home">Home (Personal)</option>
                    <option value="Work">Work (Office)</option>
                    <option value="Business">Business (HQ)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-semibold ml-1">Full Name</label>
                  <input 
                    type="text" 
                    value={addrForm.full_name} 
                    onChange={e => setAddrForm(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Recipient's Name" 
                    className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm rounded-sm ${addrErrors.full_name ? 'border-red-500' : 'border-transparent focus:border-primary/20'}`}
                  />
                  {addrErrors.full_name && <p className="text-[9px] text-red-500 ml-1">{addrErrors.full_name}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-semibold ml-1">Mobile Number (10 Digits)</label>
                  <input 
                    type="tel" 
                    value={addrForm.phone} 
                    onChange={e => setAddrForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    placeholder="Mobile Number" 
                    className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm rounded-sm ${addrErrors.phone ? 'border-red-500' : 'border-transparent focus:border-primary/20'}`}
                  />
                  {addrErrors.phone && <p className="text-[9px] text-red-500 ml-1">{addrErrors.phone}</p>}
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-semibold ml-1">Alternate Number (Optional)</label>
                  <input 
                    type="tel" 
                    value={addrForm.alt_phone} 
                    onChange={e => setAddrForm(prev => ({ ...prev, alt_phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    placeholder="Alternate Number" 
                    className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm rounded-sm ${addrErrors.alt_phone ? 'border-red-500' : 'border-transparent'}`}
                  />
                  {addrErrors.alt_phone && <p className="text-[9px] text-red-500 ml-1">{addrErrors.alt_phone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2 md:col-span-1">
                  <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-semibold ml-1">House/Flat Number</label>
                  <input 
                    type="text" 
                    value={addrForm.flat_number} 
                    onChange={e => setAddrForm(prev => ({ ...prev, flat_number: e.target.value }))}
                    placeholder="e.g. A-301, 3rd Floor" 
                    className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm rounded-sm ${addrErrors.flat_number ? 'border-red-500' : 'border-transparent focus:border-primary/20'}`}
                  />
                  {addrErrors.flat_number && <p className="text-[9px] text-red-500 ml-1">{addrErrors.flat_number}</p>}
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-semibold ml-1">Street / Apartment name</label>
                  <input 
                    type="text" 
                    value={addrForm.street} 
                    onChange={e => setAddrForm(prev => ({ ...prev, street: e.target.value }))}
                    placeholder="Street/Road/Apartment name" 
                    className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm rounded-sm ${addrErrors.street ? 'border-red-500' : 'border-transparent focus:border-primary/20'}`}
                  />
                  {addrErrors.street && <p className="text-[9px] text-red-500 ml-1">{addrErrors.street}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-semibold ml-1">Landmark (Optional)</label>
                  <input 
                    type="text" 
                    value={addrForm.landmark} 
                    onChange={e => setAddrForm(prev => ({ ...prev, landmark: e.target.value }))}
                    placeholder="e.g. Near Grand Hyatt Hotel" 
                    className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm rounded-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-semibold ml-1">Area/Sector (Optional)</label>
                  <input 
                    type="text" 
                    value={addrForm.area} 
                    onChange={e => setAddrForm(prev => ({ ...prev, area: e.target.value }))}
                    placeholder="e.g. Saket, Sector 4" 
                    className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm rounded-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-semibold ml-1">City</label>
                  <input 
                    type="text" 
                    value={addrForm.city} 
                    onChange={e => setAddrForm(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="City" 
                    className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm rounded-sm ${addrErrors.city ? 'border-red-500' : 'border-transparent focus:border-primary/20'}`}
                  />
                  {addrErrors.city && <p className="text-[9px] text-red-500 ml-1">{addrErrors.city}</p>}
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-semibold ml-1">State</label>
                  <div className="relative">
                    <select 
                      value={addrForm.state} 
                      onChange={e => setAddrForm(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full bg-[#f7f3ed] p-4 border-none outline-none text-sm appearance-none rounded-sm"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none">expand_more</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-label uppercase tracking-widest text-[#765931] font-semibold ml-1">Pincode (6 Digits)</label>
                  <input 
                    type="text" 
                    value={addrForm.pincode} 
                    onChange={e => setAddrForm(prev => ({ ...prev, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    placeholder="Pincode" 
                    className={`w-full bg-[#f7f3ed] p-4 border outline-none text-sm rounded-sm ${addrErrors.pincode ? 'border-red-500' : 'border-transparent focus:border-primary/20'}`}
                  />
                  {addrErrors.pincode && <p className="text-[9px] text-red-500 ml-1">{addrErrors.pincode}</p>}
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer group" onClick={() => setAddrForm(prev => ({ ...prev, is_default: !prev.is_default }))}>
                  <div className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-all ${addrForm.is_default ? 'bg-black border-black' : 'border-[#765931]/30 group-hover:border-primary/50'}`}>
                    {addrForm.is_default && <span className="material-symbols-outlined text-white text-[16px]">check</span>}
                  </div>
                  <span className="text-sm text-on-surface-variant select-none">Set as primary default shipping address</span>
                </label>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-[#765931]/10">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="bg-transparent border border-outline-variant/30 text-on-surface py-3.5 px-6 text-[10px] font-label uppercase tracking-widest font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddrSaving}
                  className="bg-[#765931] hover:bg-[#082717] text-white py-3.5 px-8 text-[10px] font-label uppercase tracking-widest font-bold transition-colors"
                >
                  {isAddrSaving ? 'Saving Address...' : 'Commit Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

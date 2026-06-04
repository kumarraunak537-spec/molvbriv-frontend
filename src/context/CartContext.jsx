import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [globalProfile, setGlobalProfile] = useState(null)
  const [isSessionLoaded, setIsSessionLoaded] = useState(false)
  const [wishlist, setWishlist] = useState([])
  const [isCartLoaded, setIsCartLoaded] = useState(false)
  const [isWishlistLoaded, setIsWishlistLoaded] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
      setUser(session?.user || null)
      setIsSessionLoaded(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
      setUser(session?.user || null)
      setIsSessionLoaded(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load cart and wishlist when session resolves
  useEffect(() => {
    setIsCartLoaded(false)
    setIsWishlistLoaded(false)

    if (user) {
      try {
        const savedCart = localStorage.getItem(`molvbriv_cart_${user.id}`)
        setCartItems(savedCart ? JSON.parse(savedCart) : [])
      } catch (e) {
        setCartItems([])
      }
      setIsCartLoaded(true)

      // Fetch Profile Data
      async function fetchProfileData() {
        try {
          const { data: prof, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          if (!error && prof) {
            setGlobalProfile(prof);
          }
        } catch (err) {
          console.warn('Failed to fetch profile in context:', err);
        }
      }
      fetchProfileData();

      // Fetch wishlist from Supabase
      async function fetchSupabaseWishlist() {
        try {
          let { data: wlData, error: wlErr } = await supabase
            .from('wishlists')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (wlErr || !wlData) {
            const { data: newWl, error: insErr } = await supabase
              .from('wishlists')
              .insert([{ user_id: user.id }])
              .select('id')
              .single();
            if (insErr) throw insErr;
            wlData = newWl;
          }

          const { data: items, error: itemsErr } = await supabase
            .from('wishlist_items')
            .select('product_id')
            .eq('wishlist_id', wlData.id);

          if (itemsErr) throw itemsErr;
          const fetchedIds = (items || []).map(i => i.product_id);
          setWishlist(fetchedIds);
        } catch (err) {
          console.warn('Failed to sync wishlist with DB, falling back to localStorage:', err);
          try {
            const savedWishlist = localStorage.getItem(`molvbriv_wishlist_${user.id}`);
            setWishlist(savedWishlist ? JSON.parse(savedWishlist) : []);
          } catch (e) {
            setWishlist([]);
          }
        } finally {
          setIsWishlistLoaded(true);
        }
      }
      fetchSupabaseWishlist();
    } else {
      // Load guest cart for non-logged-in sessions
      try {
        const savedCart = localStorage.getItem('molvbriv_cart_guest')
        setCartItems(savedCart ? JSON.parse(savedCart) : [])
      } catch (e) {
        setCartItems([])
      }
      setIsCartLoaded(true)

      setWishlist([])
      setGlobalProfile(null)
      setIsWishlistLoaded(true)
    }
  }, [user])

  // Save cart changes to user-specific or guest storage (ONLY after loading has finished!)
  useEffect(() => {
    if (isCartLoaded) {
      try {
        if (user) {
          localStorage.setItem(`molvbriv_cart_${user.id}`, JSON.stringify(cartItems))
        } else {
          localStorage.setItem('molvbriv_cart_guest', JSON.stringify(cartItems))
        }
      } catch (e) {
        console.error('Failed to save cart:', e)
      }
    }
  }, [cartItems, user, isCartLoaded])

  // Save wishlist changes to user-specific storage (ONLY after loading has finished!)
  useEffect(() => {
    if (user && isWishlistLoaded) {
      try {
        localStorage.setItem(`molvbriv_wishlist_${user.id}`, JSON.stringify(wishlist))
      } catch (e) {
        console.error('Failed to save user wishlist:', e)
      }
    }
  }, [wishlist, user, isWishlistLoaded])

  const addToCart = useCallback((item) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }, [])

  const removeFromCart = useCallback((id) => {
    setCartItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const updateQuantity = useCallback((id, quantity) => {
    if (quantity < 1) return
    setCartItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i))
  }, [])

  const clearCart = useCallback(() => {
    setCartItems([])
  }, [])

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const taxes = Math.round(subtotal * 0.03)
  const grandTotal = subtotal + taxes

  const toggleWishlist = useCallback(async (productId) => {
    if (!user) {
      alert("Please login to manage your wishlist.")
      window.location.href = "/login"
      return
    }
    
    // Toggle state locally first for instant feedback (optimistic UI)
    const exists = wishlist.includes(productId);
    setWishlist(prev =>
      exists ? prev.filter(id => id !== productId) : [...prev, productId]
    );

    try {
      // 1. Get or create wishlist ID
      let { data: wlData, error: wlErr } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (wlErr || !wlData) {
        const { data: newWl, error: insErr } = await supabase
          .from('wishlists')
          .insert([{ user_id: user.id }])
          .select('id')
          .single();
        if (insErr) throw insErr;
        wlData = newWl;
      }
      const wishlistId = wlData.id;

      if (exists) {
        // Remove from Supabase
        await supabase
          .from('wishlist_items')
          .delete()
          .eq('wishlist_id', wishlistId)
          .eq('product_id', productId);
      } else {
        // Add to Supabase
        await supabase
          .from('wishlist_items')
          .insert([{ wishlist_id: wishlistId, product_id: productId }]);
      }
    } catch (err) {
      console.warn('Database wishlist toggle sync failed:', err);
    }
  }, [user, wishlist]);

  const isInWishlist = useCallback((productId) => {
    return wishlist.includes(productId)
  }, [wishlist])

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, updateQuantity, clearCart,
      cartCount, subtotal, taxes, grandTotal,
      isLoggedIn, setIsLoggedIn, user, isSessionLoaded,
      wishlist, toggleWishlist, isInWishlist,
      globalProfile, setGlobalProfile
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}

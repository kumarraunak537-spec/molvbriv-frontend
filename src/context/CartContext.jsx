import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [wishlist, setWishlist] = useState([])
  const [isCartLoaded, setIsCartLoaded] = useState(false)
  const [isWishlistLoaded, setIsWishlistLoaded] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
      setUser(session?.user || null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
      setUser(session?.user || null)
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

      try {
        const savedWishlist = localStorage.getItem(`molvbriv_wishlist_${user.id}`)
        setWishlist(savedWishlist ? JSON.parse(savedWishlist) : [])
      } catch (e) {
        setWishlist([])
      }
      setIsWishlistLoaded(true)
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
  const taxes = Math.round(subtotal * 0.08)
  const grandTotal = subtotal + taxes

  const toggleWishlist = useCallback((productId) => {
    if (!user) {
      alert("Please login to manage your wishlist.")
      window.location.href = "/login"
      return
    }
    setWishlist(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }, [user])

  const isInWishlist = useCallback((productId) => {
    return wishlist.includes(productId)
  }, [wishlist])

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, updateQuantity, clearCart,
      cartCount, subtotal, taxes, grandTotal,
      isLoggedIn, setIsLoggedIn, user,
      wishlist, toggleWishlist, isInWishlist
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

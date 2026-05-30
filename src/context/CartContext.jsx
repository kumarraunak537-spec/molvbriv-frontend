import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [wishlist, setWishlist] = useState([])

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

  // Load user-specific cart and wishlist when session resolves
  useEffect(() => {
    if (user) {
      try {
        const savedCart = localStorage.getItem(`molvbriv_cart_${user.id}`)
        setCartItems(savedCart ? JSON.parse(savedCart) : [])
      } catch (e) {
        setCartItems([])
      }

      try {
        const savedWishlist = localStorage.getItem(`molvbriv_wishlist_${user.id}`)
        setWishlist(savedWishlist ? JSON.parse(savedWishlist) : [])
      } catch (e) {
        setWishlist([])
      }
    } else {
      // Clear cart and wishlist when user logs out or is not authenticated
      setCartItems([])
      setWishlist([])
    }
  }, [user])

  // Save cart changes to user-specific storage
  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem(`molvbriv_cart_${user.id}`, JSON.stringify(cartItems))
      } catch (e) {
        console.error('Failed to save user cart:', e)
      }
    }
  }, [cartItems, user])

  // Save wishlist changes to user-specific storage
  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem(`molvbriv_wishlist_${user.id}`, JSON.stringify(wishlist))
      } catch (e) {
        console.error('Failed to save user wishlist:', e)
      }
    }
  }, [wishlist, user])

  const addToCart = useCallback((item) => {
    if (!user) {
      alert("Please login to add items to your cart.")
      window.location.href = "/login"
      return
    }
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }, [user])

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

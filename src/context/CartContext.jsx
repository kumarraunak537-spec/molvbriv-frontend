import React, { createContext, useContext, useState, useCallback } from 'react'

const CartContext = createContext()

const initialCartItems = [
  {
    id: 'etoile-diamond-solitaire',
    name: 'Etoile Diamond Solitaire',
    price: 12400,
    quantity: 1,
    description: '1.5 Carat Round Brilliant Cut, Platinum Band. Internally Flawless. Includes GIA Certification.',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop'
  },
  {
    id: 'aurora-hoop-earrings',
    name: 'Aurora Hoop Earrings',
    price: 4200,
    quantity: 1,
    description: '18k Hand-Polished Yellow Gold. Sculptural design inspired by celestial orbits.',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop'
  }
]

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(initialCartItems)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [wishlist, setWishlist] = useState([])

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

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const taxes = Math.round(subtotal * 0.08)
  const grandTotal = subtotal + taxes

  const toggleWishlist = useCallback((productId) => {
    setWishlist(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }, [])

  const isInWishlist = useCallback((productId) => {
    return wishlist.includes(productId)
  }, [wishlist])

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, updateQuantity,
      cartCount, subtotal, taxes, grandTotal,
      isLoggedIn, setIsLoggedIn,
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

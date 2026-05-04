import React, { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import HomePage from './pages/HomePage.jsx'
import CollectionsPage from './pages/CollectionsPage.jsx'
import ProductPage from './pages/ProductPage.jsx'
import CartPage from './pages/CartPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NewArrivalsPage from './pages/NewArrivalsPage.jsx'
import AllProductsPage from './pages/AllProductsPage.jsx'
import BuyNowPage from './pages/BuyNowPage.jsx'
import AboutUsPage from './pages/AboutUsPage.jsx'
import OrderTrackingPage from './pages/OrderTrackingPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import { CartProvider } from './context/CartContext.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function App() {
  const location = useLocation()

  return (
    <CartProvider>
      <ScrollToTop />
      <div className="min-h-screen" key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/all-products" element={<AllProductsPage />} />
          <Route path="/new-arrivals" element={<NewArrivalsPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/buy-now" element={<BuyNowPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/track-order" element={<OrderTrackingPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
      <SpeedInsights />
    </CartProvider>
  )
}

export default App

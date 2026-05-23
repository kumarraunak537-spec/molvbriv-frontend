import React, { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
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
import PaymentSuccessPage from './pages/PaymentSuccessPage.jsx'
import PaymentFailedPage from './pages/PaymentFailedPage.jsx'
import UserOrdersPage from './pages/UserOrdersPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { CartProvider } from './context/CartContext.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

import { supabase } from './supabaseClient'

function App() {
  const location = useLocation()

  useEffect(() => {
    async function loadFavicon() {
      try {
        const { data } = await supabase.from('site_settings').select('value').eq('key', 'favicon_url').single()
        if (data && data.value) {
          let link = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = data.value;
        }
      } catch (err) {
        // Silently fail if favicon not set
      }
    }
    loadFavicon();
  }, [])

  useEffect(() => {
    // Catch OAuth errors in hash fragment (e.g. from Google login failure)
    const hash = window.location.hash
    if (hash && (hash.includes('error=') || hash.includes('error_description='))) {
      const params = new URLSearchParams(hash.replace('#', '?'))
      const errorMsg = params.get('error_description') || params.get('error') || 'Authentication failed'
      // Clear the hash to prevent infinite redirect loops
      window.location.hash = ''
      // Redirect to login page with the parsed error description
      window.location.href = `/login?error=${encodeURIComponent(errorMsg)}`
    }
  }, [location.pathname])

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
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
          <Route path="/payment-failed" element={<PaymentFailedPage />} />
          <Route path="/orders" element={<UserOrdersPage />} />
        </Routes>
      </div>
    </CartProvider>
  )
}

export default App

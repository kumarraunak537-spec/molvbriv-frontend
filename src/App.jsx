import React, { useState, useEffect, Suspense, lazy } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'

const HomePage = lazy(() => import('./pages/HomePage.jsx'))
const CollectionsPage = lazy(() => import('./pages/CollectionsPage.jsx'))
const ProductPage = lazy(() => import('./pages/ProductPage.jsx'))
const CartPage = lazy(() => import('./pages/CartPage.jsx'))
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))
const NewArrivalsPage = lazy(() => import('./pages/NewArrivalsPage.jsx'))
const AllProductsPage = lazy(() => import('./pages/AllProductsPage.jsx'))
const BuyNowPage = lazy(() => import('./pages/BuyNowPage.jsx'))
const AboutUsPage = lazy(() => import('./pages/AboutUsPage.jsx'))
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage.jsx'))
const AdminPage = lazy(() => import('./pages/AdminPage.jsx'))
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage.jsx'))
const PaymentFailedPage = lazy(() => import('./pages/PaymentFailedPage.jsx'))
const UserOrdersPage = lazy(() => import('./pages/UserOrdersPage.jsx'))
const ShippingReturnsPage = lazy(() => import('./pages/ShippingReturnsPage.jsx'))
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage.jsx'))
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage.jsx'))
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'))
const BlogListPage = lazy(() => import('./pages/BlogListPage.jsx'))
const BlogDetailPage = lazy(() => import('./pages/BlogDetailPage.jsx'))
import { CartProvider } from './context/CartContext.jsx'
import { analytics } from './services/analytics'

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
    analytics.trackPageView(location.pathname + location.search)
  }, [location.pathname, location.search])

  // Favicon is now statically loaded from index.html for maximum performance

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
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-background"><div className="w-12 h-12 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin"></div></div>}>
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/all-products" element={<AllProductsPage />} />
            <Route path="/new-arrivals" element={<NewArrivalsPage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/blog" element={<BlogListPage />} />
            <Route path="/blog/:slug" element={<BlogDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/buy-now" element={<BuyNowPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/about" element={<AboutUsPage />} />
            <Route path="/shipping-returns" element={<ShippingReturnsPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms-of-service" element={<TermsOfServicePage />} />
            <Route path="/track-order" element={<OrderTrackingPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/payment-failed" element={<PaymentFailedPage />} />
            <Route path="/orders" element={<UserOrdersPage />} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </div>
    </CartProvider>
  )
}

export default App

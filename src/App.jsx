import React, { useState, useEffect, Suspense, lazy } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { CartProvider } from './context/CartContext.jsx'
import { supabase } from './supabaseClient'
import ProtectedRoute from './components/ProtectedRoute.jsx'

// Lazy load route components for code splitting
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

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Global Loading Skeleton / Spinner
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdf9f3]">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-[#1a4a35]/20 border-t-[#1a4a35] rounded-full animate-spin"></div>
        <p className="text-[#1a4a35] font-serif tracking-[0.2em] uppercase text-sm animate-pulse">Loading Molvbriv</p>
      </div>
    </div>
  )
}

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

  return (
    <CartProvider>
      <ScrollToTop />
      <div className="min-h-screen" key={location.pathname}>
        <Suspense fallback={<LoadingFallback />}>
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
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPage />
              </ProtectedRoute>
            } />
          </Routes>
        </Suspense>
      </div>
    </CartProvider>
  )
}

export default App

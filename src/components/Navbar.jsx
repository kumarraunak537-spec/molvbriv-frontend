import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { supabase } from '../supabaseClient'

export default function Navbar() {
  const { cartCount, isLoggedIn, user, setIsLoggedIn } = useCart()
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    // Subtle fade in and slide down animation on page load
    setIsVisible(true)

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Disable body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isMenuOpen])

  const menuItems = [
    { label: 'Home', path: '/' },
    { label: 'All Products', path: '/all-products' },
    { label: 'Collections', path: '/collections' },
    { label: 'New Arrivals', path: '/new-arrivals' },
    { label: 'About', path: '/about' },
    { label: 'Track Order', path: '/track-order' }
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsLoggedIn(false)
    setIsMenuOpen(false)
    navigate('/')
  }

  return (
    <>
      {/* Search Background Blur Overlay */}
      <div
        className={`fixed inset-0 z-30 transition-all duration-[400ms] ease-out bg-black/10 backdrop-blur-sm ${isSearchOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSearchOpen(false)}
      />

      <nav
        className={`fixed top-0 w-full z-40 transition-all duration-700 ease-out
        ${isScrolled ? 'bg-[#FDFBF7] py-3 md:py-3' : 'bg-transparent py-4 md:py-5'}
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
        `}
      >
        <div className="grid grid-cols-3 items-center w-full px-4 md:px-12 max-w-none">

          {/* Left: Minimal Hamburger Icon */}
          <div className="flex justify-start">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="flex flex-col justify-center items-start gap-[6px] w-8 h-8 opacity-70 hover:opacity-100 transition-opacity duration-300"
            >
              <span className="w-7 h-[1.75px] bg-black block"></span>
              <span className="w-5 h-[1.75px] bg-black block transition-all group-hover:w-7"></span>
            </button>
          </div>

          {/* Center: Brand Logo */}
          <div className="flex justify-center">
            <Link
              to="/"
              className="text-lg md:text-2xl font-medium tracking-[0.15em] md:tracking-[0.25em] text-[#1a4a35] font-serif uppercase transition-opacity hover:opacity-100"
              style={{ textRendering: 'optimizeLegibility' }}
            >
              MOLVBRIV
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex justify-end items-center gap-2 md:gap-5">
            {/* Desktop Expandable Search */}
            <div className="hidden md:flex relative items-center justify-end w-auto">
              <div
                className={`flex items-center overflow-hidden transition-all duration-[400ms] ease-out z-50
                ${isSearchOpen
                    ? 'absolute right-0 w-[400px] bg-white/40 border border-black/10 shadow-[0_4px_15px_rgba(0,0,0,0.05)] rounded-[50px] backdrop-blur-[12px] focus-within:bg-white/60 focus-within:brightness-[1.02]'
                    : 'w-9 h-9 bg-transparent border-transparent rounded-[50px]'
                  }`}
                style={isSearchOpen ? { WebkitBackdropFilter: 'blur(12px)' } : {}}
              >
                <input
                  id="luxury-search-desktop"
                  type="text"
                  placeholder="Search for luxury..."
                  className={`bg-transparent border-none outline-none focus:outline-none focus:ring-0 shadow-none text-black placeholder-gray-500 text-[15px] font-manrope transition-all duration-[400ms] ease-out
                  ${isSearchOpen ? 'w-full pl-6 pr-1 py-2.5 opacity-100 flex-1' : 'w-0 px-0 py-0 opacity-0 flex-none'}`}
                  style={{ boxShadow: 'none' }}
                  onBlur={(e) => {
                    if (!e.target.value) setIsSearchOpen(false)
                  }}
                />
                <button
                  onClick={() => {
                    if (!isSearchOpen) {
                      setIsSearchOpen(true);
                      setTimeout(() => document.getElementById('luxury-search-desktop')?.focus(), 50);
                    }
                  }}
                  className={`shrink-0 flex items-center justify-center transition-all duration-300 rounded-full
                  ${isSearchOpen ? 'w-11 h-11 text-black cursor-pointer hover:scale-[1.08] hover:brightness-110' : 'w-9 h-9 text-black opacity-70 hover:opacity-100 hover:bg-black/5'}`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile Search Toggle Button */}
            <button
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                if (!isSearchOpen) {
                  setTimeout(() => document.getElementById('luxury-search-mobile')?.focus(), 100);
                }
              }}
              className="md:hidden flex items-center justify-center w-9 h-9 text-black opacity-70 hover:opacity-100 transition-opacity duration-300"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>

            {/* Shopping Cart */}
            <Link to="/cart" className="opacity-70 hover:opacity-100 transition-opacity duration-300 relative flex items-center justify-center w-9 h-9">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              {cartCount > 0 && (
                <span className="absolute top-[2px] right-[2px] bg-black text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-medium leading-none pb-[1px]">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Profile & Session Controls (Visible only when logged in) */}
            {isLoggedIn && (
              <div className="flex items-center gap-2 md:gap-3 ml-1 md:ml-2 border-l border-black/10 pl-2 md:pl-4">
                {/* Avatar / Profile Logo */}
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden border border-black/10 flex items-center justify-center shrink-0 bg-[#1a4a35]/10">
                  {user?.user_metadata?.avatar_url ? (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt={user.user_metadata.full_name || 'User'} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="font-manrope text-[11px] md:text-[12px] font-semibold text-[#1a4a35] uppercase">
                      {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
                
                {/* User First Name / Email Prefix */}
                <span className="hidden sm:inline font-manrope text-[11px] md:text-[12px] uppercase tracking-wider text-[#2c2c2c] max-w-[80px] md:max-w-[120px] truncate">
                  {user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}
                </span>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-1 md:p-1.5 opacity-60 hover:opacity-100 hover:text-red-600 transition-all duration-300 flex items-center justify-center rounded-full hover:bg-black/5"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Mobile Search Bar - Centered Overlay in Navbar */}
        <div
          className={`md:hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] z-50 transition-all duration-[400ms] ease-out
          ${isSearchOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}
        >
          <div className="flex items-center bg-white/40 border border-black/10 shadow-[0_4px_15px_rgba(0,0,0,0.05)] rounded-[50px] backdrop-blur-[12px] focus-within:bg-white/60 focus-within:brightness-[1.02]"
            style={{ WebkitBackdropFilter: 'blur(12px)' }}
          >
            <input
              id="luxury-search-mobile"
              type="text"
              placeholder="Search for luxury..."
              className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 shadow-none text-black placeholder-gray-500 text-[14px] font-manrope pl-5 pr-1 py-3"
              style={{ boxShadow: 'none' }}
              onBlur={(e) => {
                if (!e.target.value) setTimeout(() => setIsSearchOpen(false), 150)
              }}
            />
            <button className="shrink-0 w-10 h-10 flex items-center justify-center text-black">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Slide-out Menu Overlay */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Dark Background Overlay with deep blur */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-[12px] transition-opacity duration-[600ms]"
          onClick={() => setIsMenuOpen(false)}
        ></div>

        {/* Floating Sliding Panel (Slide Animation) */}
        <div
          className={`absolute top-4 bottom-4 left-4 w-[400px] max-w-[calc(100vw-2rem)] rounded-2xl flex flex-col transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.2)]
          ${isMenuOpen ? 'translate-x-0' : 'translate-x-[calc(-100%-1rem)]'}
          `}
          style={{ backgroundColor: 'rgba(253, 251, 247, 0.95)' }}
        >
          {/* Top Section */}
          <div className="pt-4 pb-4 px-6 flex justify-start shrink-0">
            <button
              onClick={() => setIsMenuOpen(false)}
              className="text-[#2c2c2c] font-manrope text-[14px] flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity md:invisible md:pointer-events-none"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              <span className="font-light tracking-wide uppercase text-xs">Close</span>
            </button>
          </div>

          {/* Scrollable Menu Items */}
          <div className="flex-1 overflow-y-auto px-6 pt-0 pb-8 flex flex-col [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#2c2c2c]/10 [&::-webkit-scrollbar-thumb]:rounded-full">

            {/* Primary Categories */}
            <div className="flex flex-col gap-2 md:gap-4">
              {menuItems.map((item, index) => (
                <div
                  key={item.label}
                  className={`transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${isMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-[-20px]'}`}
                  style={{
                    transitionDelay: isMenuOpen ? `${100 + (index * 50)}ms` : '0ms'
                  }}
                >
                  <Link
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="relative font-manrope text-[16px] tracking-wide text-[#2c2c2c] font-light flex justify-between items-center group py-1"
                  >
                    <span className="capitalize relative inline-block transition-transform duration-300 group-hover:translate-x-2">
                      {item.label}
                    </span>
                    <span className="text-[#2c2c2c]/40 font-light group-hover:text-primary transition-colors text-lg leading-none">›</span>
                  </Link>
                </div>
              ))}
            </div>

          </div>

          {/* Bottom Section: Login / Account */}
          <div className={`px-6 pb-8 pt-6 border-t border-black/5 shrink-0 transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: isMenuOpen ? '350ms' : '0ms' }}>
            {isLoggedIn ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 text-[#2c2c2c]">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-manrope text-[13px] font-medium">{user?.user_metadata?.full_name || 'My Account'}</span>
                    <span className="font-manrope text-[10px] text-text-muted">{user?.email}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-4 text-red-500/80 font-manrope font-light hover:text-red-500 transition-colors group w-full text-left"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  <span className="text-[14px] tracking-wide relative">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between text-[#2c2c2c] font-manrope font-light hover:text-primary transition-colors group w-full"
              >
                <div className="flex items-center gap-4">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 group-hover:opacity-100 transition-opacity">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span className="text-[15px] tracking-wide relative">
                    Login Account
                    <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-primary transition-all duration-300 group-hover:w-full"></span>
                  </span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

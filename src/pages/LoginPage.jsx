import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { supabase } from '../supabaseClient'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setIsLoggedIn } = useCart()
  const [mode, setMode] = useState('login') // 'login' or 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [authError, setAuthError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotMessage, setForgotMessage] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error')
    if (err) {
      setAuthError(decodeURIComponent(err).replace(/\+/g, ' '))
    }
  }, [])

  const validateLogin = () => {
    const newErrors = {}
    const identifier = email.trim()
    const isPhone = /^\d{10}$/.test(identifier)
    const isEmail = /\S+@\S+\.\S+/.test(identifier)

    if (!identifier) {
      newErrors.email = 'Please enter your Email or Phone Number'
    } else if (!isPhone && !isEmail) {
      newErrors.email = 'Please enter a valid Email or 10-digit Phone Number'
    }

    if (!password || password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateRegister = () => {
    const newErrors = {}
    if (!name) newErrors.name = 'Name is required'
    if (!email || !/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Please enter a valid email'
    if (!phone || !/^\d{10}$/.test(phone.trim())) newErrors.phone = 'Please enter a valid 10-digit phone number'
    if (!password || password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    setAuthError('')
    setSuccessMessage('')
    if (validateLogin()) {
      setLoading(true)
      const identifier = email.trim()
      const isPhone = /^\d{10}$/.test(identifier)
      
      let loginEmail = identifier

      if (isPhone) {
        try {
          // Query the profiles table securely via RPC function to bypass RLS for non-logged-in sessions
          const { data: resolvedEmail, error: rpcErr } = await supabase
            .rpc('get_email_by_phone', { p_phone: identifier })

          if (rpcErr || !resolvedEmail) {
            setAuthError('No account found with this phone number.')
            setLoading(false)
            return
          }
          loginEmail = resolvedEmail
        } catch (err) {
          setAuthError('Could not resolve phone number. Please sign in with email.')
          setLoading(false)
          return
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      })
      if (error) {
        setAuthError(error.message)
        setLoading(false)
      } else {
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect');
        navigate(redirect ? `/${redirect}` : '/');
      }
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setAuthError('')
    setSuccessMessage('')
    if (validateRegister()) {
      setLoading(true)
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              phone: phone.trim()
            }
          }
        })
        if (error) {
          setAuthError(error.message)
          setLoading(false)
        } else {
          if (data?.user?.identities?.length === 0) {
             setAuthError('This email is already registered. Please sign in.')
             setLoading(false)
          } else if (!data.session) {
             // Email confirmation is active in Supabase (sets green success message card)
             setSuccessMessage('Account created successfully! Please check your email inbox to verify your account before logging in.')
             setLoading(false)
          } else {
             // Verification is disabled, user logs in automatically
             const params = new URLSearchParams(window.location.search);
             const redirect = params.get('redirect');
             navigate(redirect ? `/${redirect}` : '/');
          }
        }
      } catch (err) {
        setAuthError(err.message || 'An unexpected registration error occurred.')
        setLoading(false)
      }
    }
  }

  const handleForgotPassword = async () => {
    setAuthError('')
    setSuccessMessage('')
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'Please enter a valid email first' })
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) {
      setAuthError(error.message)
    } else {
      setForgotMessage(true)
      setTimeout(() => setForgotMessage(false), 4000)
    }
  }

  const handleOAuthLogin = async (provider) => {
    setAuthError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })
    if (error) {
      setAuthError(error.message)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Half - Image */}
      <div className="hidden lg:flex w-1/2 relative bg-[#0D2018] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1600721391776-b5cd0e0048f9?w=900&h=1200&fit=crop"
          alt="Luxury sapphire necklace"
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D2018]/40 via-transparent to-[#0D2018]/60"></div>

        {/* Overlay text removed */}

        {/* Bottom left branding */}
        <div className="absolute bottom-8 left-8">
          <p className="font-manrope text-[10px] uppercase tracking-[0.3em] text-white/60">MOLVBRIV</p>
        </div>
      </div>

      {/* Right Half - Form */}
      <div className="w-full lg:w-1/2 bg-cream flex flex-col items-center justify-center px-5 lg:px-20 py-12 lg:py-0 relative"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      >
        <div className="w-full max-w-[420px]">
          {/* Logo */}
          <p className="text-center font-manrope text-[12px] uppercase tracking-[0.35em] text-gold mb-8">
            M O L V B R I V
          </p>

          {mode === 'login' ? (
            <>
              {/* Login Form */}
              <h1 className="font-manrope text-[32px] lg:text-[40px] text-primary text-center mb-2">Welcome Back</h1>
              <div className="flex justify-center mb-10">
                <span className="text-text-muted text-[14px]">◇</span>
              </div>
              
              {authError && <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-manrope text-center rounded">{authError}</div>}
              {successMessage && (
                <div className="mb-6 p-4 bg-[#082717]/5 border border-[#082717]/20 text-primary text-xs font-manrope text-center rounded shadow-sm">
                  <div className="flex items-center justify-center gap-2 mb-1.5">
                    <span className="text-gold text-sm font-bold">✓</span>
                    <span className="text-[#082717] font-bold uppercase tracking-[0.15em] text-[10px]">Registration Successful</span>
                  </div>
                  <p className="text-[#15462D] leading-relaxed font-medium">{successMessage}</p>
                </div>
              )}

              <form onSubmit={handleSignIn} className="space-y-8">
                <div>
                  <label className="font-manrope text-[9px] uppercase tracking-nav text-text-muted block mb-3">EMAIL OR PHONE NUMBER</label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="curator@molvbriv.com or 9876543210"
                    className="w-full bg-transparent border-b border-[#C0B8A8] pb-3 font-manrope text-[13px] text-primary placeholder:text-[#B0A890] focus:border-primary transition-colors"
                  />
                  {errors.email && <p className="text-red-500 text-[10px] mt-1 font-manrope">{errors.email}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="font-manrope text-[9px] uppercase tracking-nav text-text-muted">PASSWORD</label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="font-manrope text-[9px] uppercase tracking-nav text-gold hover:text-primary transition-colors"
                    >
                      FORGOT PASSWORD?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="• • • • • • • •"
                    className="w-full bg-transparent border-b border-[#C0B8A8] pb-3 font-manrope text-[13px] text-primary placeholder:text-[#B0A890] focus:border-primary transition-colors"
                  />
                  {errors.password && <p className="text-red-500 text-[10px] mt-1 font-manrope">{errors.password}</p>}
                  {forgotMessage && (
                    <p className="text-gold text-[11px] mt-2 font-manrope">A password reset link has been sent to your email.</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white font-manrope text-[11px] uppercase tracking-nav py-4 hover:bg-[#244a39] transition-colors disabled:opacity-70"
                >
                  {loading ? 'SIGNING IN...' : 'SIGN IN'}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-[#D0C8B8]"></div>
                <span className="font-manrope text-[10px] text-text-muted">OR</span>
                <div className="flex-1 h-px bg-[#D0C8B8]"></div>
              </div>

              {/* Social Sign In */}
              <div className="space-y-3">
                <button type="button" onClick={() => handleOAuthLogin('google')} className="w-full border border-[#D0C8B8] bg-white font-manrope text-[11px] uppercase tracking-nav py-4 flex items-center justify-center gap-3 hover:bg-[#F5F0E8] transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  CONTINUE WITH GOOGLE
                </button>
              </div>

              {/* Register link */}
              <p className="text-center mt-8 font-manrope text-[11px] text-primary">
                NEW TO MOLVBRIV?{' '}
                <button
                  onClick={() => { setMode('register'); setErrors({}); setAuthError(''); setSuccessMessage(''); }}
                  className="text-gold underline underline-offset-2 hover:text-primary transition-colors uppercase tracking-nav font-medium"
                >
                  CREATE ACCOUNT
                </button>
              </p>
            </>
          ) : (
            <>
              {/* Register Form */}
              <h1 className="font-manrope text-[32px] lg:text-[40px] text-primary text-center mb-2">Create Account</h1>
              <div className="flex justify-center mb-10">
                <span className="text-text-muted text-[14px]">◇</span>
              </div>
              
              {authError && <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-manrope text-center rounded">{authError}</div>}
              {successMessage && (
                <div className="mb-6 p-4 bg-[#082717]/5 border border-[#082717]/20 text-primary text-xs font-manrope text-center rounded shadow-sm">
                  <div className="flex items-center justify-center gap-2 mb-1.5">
                    <span className="text-gold text-sm font-bold">✓</span>
                    <span className="text-[#082717] font-bold uppercase tracking-[0.15em] text-[10px]">Registration Successful</span>
                  </div>
                  <p className="text-[#15462D] leading-relaxed font-medium">{successMessage}</p>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-6">
                <div>
                  <label className="font-manrope text-[9px] uppercase tracking-nav text-text-muted block mb-3">FULL NAME</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Full Name"
                    className="w-full bg-transparent border-b border-[#C0B8A8] pb-3 font-manrope text-[13px] text-primary placeholder:text-[#B0A890] focus:border-primary transition-colors"
                  />
                  {errors.name && <p className="text-red-500 text-[10px] mt-1 font-manrope">{errors.name}</p>}
                </div>

                <div>
                  <label className="font-manrope text-[9px] uppercase tracking-nav text-text-muted block mb-3">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="curator@molvbriv.com"
                    className="w-full bg-transparent border-b border-[#C0B8A8] pb-3 font-manrope text-[13px] text-primary placeholder:text-[#B0A890] focus:border-primary transition-colors"
                  />
                  {errors.email && <p className="text-red-500 text-[10px] mt-1 font-manrope">{errors.email}</p>}
                </div>

                <div>
                  <label className="font-manrope text-[9px] uppercase tracking-nav text-text-muted block mb-3">PHONE NUMBER</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Your Phone Number (e.g. 9876543210)"
                    className="w-full bg-transparent border-b border-[#C0B8A8] pb-3 font-manrope text-[13px] text-primary placeholder:text-[#B0A890] focus:border-primary transition-colors"
                  />
                  {errors.phone && <p className="text-red-500 text-[10px] mt-1 font-manrope">{errors.phone}</p>}
                </div>

                <div>
                  <label className="font-manrope text-[9px] uppercase tracking-nav text-text-muted block mb-3">PASSWORD</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="• • • • • • • •"
                    className="w-full bg-transparent border-b border-[#C0B8A8] pb-3 font-manrope text-[13px] text-primary placeholder:text-[#B0A890] focus:border-primary transition-colors"
                  />
                  {errors.password && <p className="text-red-500 text-[10px] mt-1 font-manrope">{errors.password}</p>}
                </div>

                <div>
                  <label className="font-manrope text-[9px] uppercase tracking-nav text-text-muted block mb-3">CONFIRM PASSWORD</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="• • • • • • • •"
                    className="w-full bg-transparent border-b border-[#C0B8A8] pb-3 font-manrope text-[13px] text-primary placeholder:text-[#B0A890] focus:border-primary transition-colors"
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-[10px] mt-1 font-manrope">{errors.confirmPassword}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white font-manrope text-[11px] uppercase tracking-nav py-4 hover:bg-[#244a39] transition-colors disabled:opacity-70"
                >
                  {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                </button>
              </form>

              <p className="text-center mt-8 font-manrope text-[11px] text-primary">
                ALREADY HAVE AN ACCOUNT?{' '}
                <button
                  onClick={() => { setMode('login'); setErrors({}); setAuthError(''); setSuccessMessage(''); }}
                  className="text-gold underline underline-offset-2 hover:text-primary transition-colors uppercase tracking-nav font-medium"
                >
                  SIGN IN
                </button>
              </p>
            </>
          )}
        </div>

        {/* Footer text */}
        <p className="absolute bottom-6 font-manrope text-[9px] text-text-muted uppercase tracking-widest">
          © 2024 MOLVBRIV. THE TIMELESS CURATOR.
        </p>
      </div>
    </div>
  )
}

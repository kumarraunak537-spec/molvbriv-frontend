# MOLVBRIV E-COMMERCE — INTERNAL PROJECT MEMORY & ARCHITECTURE BLUEPRINT

## 1. PROJECT ARCHITECTURE OVERVIEW
- **Project Name**: Molvbriv (Luxury E-Commerce Jewelry & Fashion Atelier)
- **Frontend Stack**: React 18 + React Router DOM v6 + Tailwind CSS (v3.4) + Vite 6 + Material Symbols Icons
- **Backend Stack**: Node.js + Express + Razorpay Node SDK + Shiprocket Logistics API + Nodemailer Email Service
- **Database Layer**: Supabase PostgreSQL + Row Level Security (RLS) + Storage Buckets (`products`, `reviews`, `avatars`)
- **Hosting & Deployment**: Vercel (Frontend & Serverless Functions / Custom Express Proxy)

---

## 2. FOLDER STRUCTURE
```
molvbriv2.0/
├── backend/
│   ├── .env                       # Backend Secrets (RAZORPAY, SHIPROCKET, SMTP, SUPABASE)
│   ├── emailService.js            # Transactional HTML Email Engine (Order/Shipped/Reset)
│   ├── package.json               # Backend Node dependencies
│   ├── server.js                  # Express API Server (Payment Verification, Shiprocket Sync, RBAC)
│   └── test_shiprocket_sync.js    # Shiprocket integration testing script
├── src/
│   ├── assets/                    # Product media, brand logos & video banners
│   ├── components/
│   │   ├── Footer.jsx             # Site footer with luxury branding, newsletter & policy links
│   │   ├── Navbar.jsx             # Main navigation header with cart drawer, mobile menu, search
│   │   ├── ProductReviews.jsx     # Customer reviews & ratings system with media upload
│   │   └── ProtectedRoute.jsx     # Auth guard wrapper for authenticated routes
│   ├── context/
│   │   └── CartContext.jsx        # Unified global state (Cart, Wishlist, User Session, Profile)
│   ├── data/
│   │   └── products.js            # Fallback static product dataset
│   ├── hooks/
│   │   └── useRole.js             # Supabase user role validator (`user` vs `admin`)
│   ├── pages/
│   │   ├── AboutUsPage.jsx        # Atelier brand story & heritage
│   │   ├── AdminPage.jsx          # Comprehensive Admin Management Suite
│   │   ├── AllProductsPage.jsx    # Full catalog view with filters & sorting
│   │   ├── BuyNowPage.jsx         # Direct checkout route
│   │   ├── CartPage.jsx           # Cart management & checkout modal
│   │   ├── CollectionsPage.jsx    # Curated collections showcase
│   │   ├── HomePage.jsx           # Landing page with hero banner & featured items
│   │   ├── LoginPage.jsx          # Auth portal (Email/Password, Magic Link, Google OAuth, Phone OTP)
│   │   ├── NewArrivalsPage.jsx    # Recent product releases
│   │   ├── OrderTrackingPage.jsx  # Live order & shipment tracking portal
│   │   ├── PaymentFailedPage.jsx  # Payment failure recovery screen
│   │   ├── PaymentSuccessPage.jsx # Order confirmation & payment success state
│   │   ├── PrivacyPolicyPage.jsx  # Privacy policy document
│   │   ├── ProductPage.jsx        # Dynamic product detailed page (PDP)
│   │   ├── ProfilePage.jsx        # User profile, address manager & order history
│   │   ├── ShippingReturnsPage.jsx# Shipping & return policy guidelines
│   │   ├── TermsOfServicePage.jsx # Terms of service agreement
│   │   └── UserOrdersPage.jsx     # Customer personal order history page
│   ├── services/
│   │   └── analytics.js           # Event analytics tracking service
│   ├── utils/
│   │   └── seo.js                 # Dynamic SEO Meta & OpenGraph utility
│   ├── App.jsx                    # React Router configuration & Suspense fallback
│   ├── index.css                  # Custom CSS variables, scrollbars & glassmorphism classes
│   ├── main.jsx                   # React entrypoint
│   └── supabaseClient.js          # Supabase Client SDK & Memory Cache Helper
├── scripts/
│   └── generate-sitemap.js        # Automated build script for sitemap XML generation
├── supabase/                      # Edge functions & migrations
├── supabase_schema.sql            # Master PostgreSQL schema & RLS definitions
├── tailwind.config.js             # Master Design System Tokens (Palette, Fonts, Radii)
└── vite.config.js                 # Vite build & plugin configuration
```

---

## 3. DESIGN SYSTEM & UI TOKENS
### Color Palette
- **Primary**: `#082717` (Deep Emerald / Forest Green)
- **Primary Container**: `#1f3d2b`
- **Secondary**: `#765931` (Warm Antique Gold)
- **Secondary Container**: `#fed6a3`
- **Background**: `#fdf9f3` (Warm Ivory Cream)
- **Surface**: `#fdf9f3`
- **Surface Container**: `#f1ede7`
- **On-Surface / Text**: `#1c1c18` (Soft Charcoal)
- **Outline / Ghost Border**: `#727972` / `rgba(114, 121, 114, 0.15)`
- **Error**: `#ba1a1a`

### Typography
- **Primary Sans-Serif**: `Manrope`, sans-serif (Headlines, Body, Buttons)
- **Serif Accents**: `Playfair Display`, `Cormorant Garamond`, `Noto Serif`

### Styling Patterns
- **Glassmorphism**: `.glass-card` -> `background: rgba(255, 255, 255, 0.06); backdrop-filter: blur(12px);`
- **Custom Scrollbar**: Width `8px`, thumb `#765931`, track `#fdf9f3`
- **Material Symbols**: `'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24`

---

## 4. DATABASE ARCHITECTURE (SUPABASE POSTGRESQL)
### Primary Tables
1. **`profiles`**: User metadata, `role` (`user` | `admin`), `phone`, `avatar_url`, `created_at`.
2. **`products`**: `title`, `slug`, `price`, `compare_price`, `stock`, `images[]`, `status` (`live` | `draft`), `variants`, `sku`.
3. **`categories`**: Category taxonomy (`name`, `slug`, `description`).
4. **`orders`**: Customer details (`customer_name`, `customer_email`, `customer_phone`), `total_amount`, `shipping_address` (JSONB), `payment_status`, `order_status`, `razorpay_order_id`, `razorpay_payment_id`, Shiprocket tracking metadata (`shiprocket_order_id`, `shipment_id`, `awb_code`, `courier_name`, `tracking_id`, `shipping_label_url`, `shipment_status`, `shipment_history`).
5. **`order_items`**: `order_id`, `product_id`, `quantity`, `price_at_time`, `color_selected`.
6. **`reviews`**: `user_id`, `product_id`, `rating`, `comment`, `status` (`approved` | `pending`).
7. **`addresses`**: User shipping/billing address book (`flat_number`, `street`, `landmark`, `city`, `state`, `pincode`, `is_default`).
8. **`wishlists` & `wishlist_items`**: User saved item collections.
9. **`subscribers`**: Newsletter email list.
10. **`email_logs`**: Transactional email tracking logs.

---

## 5. API FLOW & LOGISTICS INTEGRATION
1. **Order Creation & Payment**:
   - Customer submits checkout form -> Frontend requests Razorpay Order from Express Backend (`/api/create-razorpay-order`).
   - Customer completes Razorpay Modal -> Frontend posts payment signature to Backend (`/api/verify-payment`).
   - Backend verifies signature using HMAC SHA256 -> Writes Order to Supabase (bypassing RLS with Service Role Key) -> Sends Confirmation Email via `emailService.js` -> Trigger Shiprocket Auto Sync (`createShiprocketOrder`).
2. **Shiprocket Logistics**:
   - Express server negotiates auth token with `https://apiv2.shiprocket.in/v1/external/auth/login` (cached 23h).
   - Creates adhoc order -> Assigns courier & gets AWB tracking number.
   - If Shiprocket API is unreachable or unconfigured, gracefully falls back to **Simulation Mode** without failing order flow.

---

## 6. SECURITY & PERFORMANCE POLICIES
- **Security**:
  - Helmet CSP directives & HTTP security headers.
  - Express Rate Limiting: Global (200 req / 15m), Sensitive/Payment (10 req / 10m).
  - Global XSS and SQL Injection Input Sanitization Middleware.
  - Supabase Row Level Security (RLS) on all tables with `is_admin()` helper function.
- **Performance**:
  - Memory Caching in `supabaseClient.js` (`getCachedProducts`, `getCachedRatingsMap`).
  - React Suspense + Code Splitting (lazy loaded pages in `App.jsx`).
  - Optimistic UI updates in `CartContext.jsx` for wishlist & cart operations.

---

## 7. LOCK & MAINTENANCE POLICY AGENTS RULE
- Existing UI/UX, layouts, fonts, colors, spacing, icons, and navigation are locked as source-of-truth.
- Strict policy enforced: No unsolicited refactoring, cleanup, or redesign. Modifying code must strictly match user instructions and preserve existing patterns.

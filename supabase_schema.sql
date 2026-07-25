-- MOLVBRIV E-COMMERCE DATABASE SCHEMA (SUPABASE)

-- 1. Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Users Table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  phone TEXT,
  address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_price DECIMAL(10,2),
  images TEXT[] DEFAULT '{}',
  stock INTEGER DEFAULT 0,
  material TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  colors TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('live', 'draft', 'out_of_stock')),
  tags TEXT[] DEFAULT '{}',
  variants JSONB DEFAULT '[]'::jsonb,
  sku TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  shipping_address JSONB NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Site Settings Table
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Site Settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to settings
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.site_settings FOR SELECT
  USING ( true );

-- Allow admins to insert/update settings
CREATE POLICY "Admins can insert site settings."
  ON public.site_settings FOR INSERT
  WITH CHECK ( EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin') );

CREATE POLICY "Admins can update site settings."
  ON public.site_settings FOR UPDATE
  USING ( EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin') );


-- 6. Create Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_time DECIMAL(10,2) NOT NULL,
  color_selected TEXT
);

-- 7. Create Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- 8. Create Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_percentage DECIMAL(5,2),
  discount_amount DECIMAL(10,2),
  expiry_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Create the secure admin helper function with SECURITY DEFINER to bypass RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND role = 'admin'
  );
END;
$$;

-- Profile Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by owner or admin." ON public.profiles;
CREATE POLICY "Profiles are viewable by owner or admin." ON public.profiles FOR SELECT USING (
  auth.uid() = id OR 
  public.is_admin(auth.uid())
);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Product Policies (Publicly readable, Admin editable)
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Category Policies
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Order Policies
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can insert their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Order Items Policies
CREATE POLICY "Users can view their own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND user_id = auth.uid()) OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can insert order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND user_id = auth.uid())
);

-- Reviews Policies
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

-- Create Storage Bucket for Product Images
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('reviews', 'reviews', true) ON CONFLICT DO NOTHING;

-- Storage Policies
CREATE POLICY "Product images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Admins can upload images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'products' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'products' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete images" ON storage.objects FOR DELETE USING (
  bucket_id = 'products' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Review media are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'reviews');
CREATE POLICY "Anyone can upload review media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'reviews');

-- Function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Boutique Patron'),
    new.email,
    'user',
    COALESCE(new.phone, new.raw_user_meta_data->>'phone')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==================================================
-- UPGRADE ORDERS TABLE FOR COMPLETE VISIBILITY SYSTEM
-- ==================================================

-- Safely add missing columns to public.orders if they do not exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS products JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_status TEXT DEFAULT 'Pending';

-- Ensure compatible columns are synced and non-null values populated
UPDATE public.orders SET total_amount = total_price WHERE total_amount IS NULL AND total_price IS NOT NULL;
UPDATE public.orders SET payment_id = razorpay_payment_id WHERE payment_id IS NULL AND razorpay_payment_id IS NOT NULL;
UPDATE public.orders SET order_status = INITCAP(status) WHERE order_status IS NULL AND status IS NOT NULL;

-- Enable Row Level Security (RLS) on public.orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Safely drop old policies if they exist to prevent conflicts
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders or Admins view all" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

-- 1. Users can view their own orders, or admins can view all orders
CREATE POLICY "Users can view their own orders or Admins view all" ON public.orders
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- 2. Only Admins can insert orders (Frontend users must use the backend API)
CREATE POLICY "Admins can insert orders" ON public.orders
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- 3. Admins can update orders
CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- 4. Secure public order tracking function (SECURITY DEFINER bypasses RLS safely)
CREATE OR REPLACE FUNCTION public.track_order(p_order_id TEXT, p_email TEXT)
RETURNS SETOF public.orders
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.orders
  WHERE (razorpay_order_id = p_order_id OR id::text = p_order_id)
    AND LOWER(customer_email) = LOWER(p_email);
END;
$$;

-- ==================================================
-- SHIPROCKET SECURE LOGISTICS INTEGRATION UPGRADE
-- ==================================================
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shiprocket_order_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS awb_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_label_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipment_status TEXT DEFAULT 'Pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipment_history JSONB DEFAULT '[]'::jsonb;

-- ==================================================
-- SECURE PUBLIC HELPER: RESOLVE EMAIL BY PHONE
-- ==================================================
CREATE OR REPLACE FUNCTION public.get_email_by_phone(p_phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email
  FROM public.profiles
  WHERE phone = p_phone
  LIMIT 1;
  
  RETURN v_email;
END;
$$;

-- ==================================================
-- MIGRATION PATCH: ENABLE PHONE OTP SIGNUPS
-- ==================================================
-- RUN THESE THREE LINES IN YOUR SUPABASE SQL EDITOR TO APPLY PATCH TO LIVE DATABASE:
--
-- ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;
--
-- CREATE OR REPLACE FUNCTION public.handle_new_user()
-- RETURNS trigger AS $$
-- BEGIN
--   INSERT INTO public.profiles (id, name, email, role, phone)
--   VALUES (
--     new.id,
--     COALESCE(new.raw_user_meta_data->>'full_name', 'Boutique Patron'),
--     new.email,
--     'user',
--     COALESCE(new.phone, new.raw_user_meta_data->>'phone')
--   );
--   RETURN new;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- TRANSACTIONAL EMAIL SYSTEM INTEGRATION (email_logs)
-- ==================================================
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refund_processed', 'newsletter_welcome', 'newsletter_admin')),
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view/insert logs
CREATE POLICY "Admins can manage email logs" ON public.email_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- ==================================================
-- NEWSLETTER SUBSCRIPTION SYSTEM (subscribers)
-- ==================================================
CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (so anyone can subscribe)
CREATE POLICY "Anyone can subscribe to newsletter" ON public.subscribers
  FOR INSERT WITH CHECK (true);

-- Only admins can view the subscriber list
CREATE POLICY "Admins can view subscribers" ON public.subscribers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- ==================================================
-- MIGRATION PATCH: BILLING ADDRESS COLUMN SUPPORT (OPTIONAL)
-- ==================================================
-- This schema stores billing address details nested inside the orders.shipping_address JSONB payload safely to prevent relational insertion errors on legacy databases.
-- However, you can run the statement below inside your Supabase SQL Editor if you prefer to have a dedicated billing_address column:
--
-- ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS billing_address JSONB;

-- ==================================================
-- SYSTEM UPGRADE: CUSTOMER PROFILE & ADDRESS BOOK & WISHLIST
-- ==================================================

-- 1. Add optional avatar_url and updated_at to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 1b. Create Storage Bucket for User Avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;

-- Storage Policies for Avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can update avatars" ON storage.objects FOR UPDATE USING (
  bucket_id = 'avatars' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can delete avatars" ON storage.objects FOR DELETE USING (
  bucket_id = 'avatars' AND auth.role() = 'authenticated'
);

-- 2. Create addresses table
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  address_type TEXT DEFAULT 'Home' CHECK (address_type IN ('Home', 'Work', 'Business', 'Other')),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  alt_phone TEXT,
  flat_number TEXT NOT NULL,
  street TEXT NOT NULL,
  landmark TEXT,
  area TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT DEFAULT 'India',
  pincode TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user addresses lookups
CREATE INDEX IF NOT EXISTS addresses_user_id_idx ON public.addresses(user_id);

-- Enable RLS
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can manage their own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Admins can view all addresses" ON public.addresses;

-- Create secure policies
CREATE POLICY "Users can manage their own addresses" ON public.addresses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all addresses" ON public.addresses
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 3. Automatic single default address handler
CREATE OR REPLACE FUNCTION public.handle_address_default()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.addresses
    SET is_default = false
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_address_default ON public.addresses;
CREATE TRIGGER trigger_address_default
  BEFORE INSERT OR UPDATE ON public.addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_address_default();

-- 4. Create wishlists table
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own wishlist" ON public.wishlists;
CREATE POLICY "Users can manage their own wishlist" ON public.wishlists
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Create wishlist_items table
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wishlist_id, product_id)
);

-- Index for wishlist item lookups
CREATE INDEX IF NOT EXISTS wishlist_items_wishlist_id_idx ON public.wishlist_items(wishlist_id);

-- Enable RLS
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own wishlist items" ON public.wishlist_items;
CREATE POLICY "Users can manage their own wishlist items" ON public.wishlist_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.wishlists 
      WHERE wishlists.id = wishlist_items.wishlist_id 
      AND wishlists.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.wishlists 
      WHERE wishlists.id = wishlist_items.wishlist_id 
      AND wishlists.user_id = auth.uid()
    )
  );

-- Auto-provision a wishlist when a new profile is created
CREATE OR REPLACE FUNCTION public.handle_wishlist_auto_provision()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wishlists (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_wishlist_auto_provision ON public.profiles;
CREATE TRIGGER trigger_wishlist_auto_provision
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_wishlist_auto_provision();

-- Provision wishlists for all existing profiles right now
INSERT INTO public.wishlists (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- ==================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- ==================================================
-- Performance optimization indexes on public.orders
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS orders_razorpay_order_id_idx ON public.orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS orders_payment_id_idx ON public.orders(payment_id);
CREATE INDEX IF NOT EXISTS orders_awb_code_idx ON public.orders(awb_code);

-- Performance optimization indexes on public.email_logs
CREATE INDEX IF NOT EXISTS email_logs_order_id_idx ON public.email_logs(order_id);
CREATE INDEX IF NOT EXISTS email_logs_order_id_type_idx ON public.email_logs(order_id, email_type);

-- Track Shiprocket sync status & error log
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shiprocket_sync_status TEXT DEFAULT 'Pending' CHECK (shiprocket_sync_status IN ('Pending', 'Created', 'Failed'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shiprocket_sync_error TEXT;

-- ==================================================
-- BLOG MANAGEMENT SYSTEM SCHEMA
-- ==================================================

-- 1. Blog Categories
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Blog Tags
CREATE TABLE IF NOT EXISTS public.blog_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Blogs Table
CREATE TABLE IF NOT EXISTS public.blogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  content_format TEXT DEFAULT 'html' CHECK (content_format IN ('html', 'markdown')),
  featured_image TEXT,
  gallery TEXT[] DEFAULT '{}',
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  author_name TEXT DEFAULT 'Molvbriv Editorial',
  author_role TEXT DEFAULT 'Jewellery Stylist & Specialist',
  author_avatar TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  canonical_url TEXT,
  faqs JSONB DEFAULT '[]'::jsonb,
  reading_time_min INTEGER DEFAULT 3,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Blog Comments Table
CREATE TABLE IF NOT EXISTS public.blog_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_id TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  comment TEXT NOT NULL,
  status TEXT DEFAULT 'approved',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Blog Views (for analytics / view count)
CREATE TABLE IF NOT EXISTS public.blog_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_id TEXT NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Blog Likes
CREATE TABLE IF NOT EXISTS public.blog_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blog_id, session_id)
);

-- 7. Blog Related Products Junction
CREATE TABLE IF NOT EXISTS public.blog_related_products (
  blog_id UUID NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (blog_id, product_id)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS blogs_slug_idx ON public.blogs(slug);
CREATE INDEX IF NOT EXISTS blogs_status_pub_idx ON public.blogs(status, published_at DESC);
CREATE INDEX IF NOT EXISTS blogs_category_id_idx ON public.blogs(category_id);
CREATE INDEX IF NOT EXISTS blogs_tags_gin_idx ON public.blogs USING GIN(tags);
CREATE INDEX IF NOT EXISTS blog_comments_blog_id_idx ON public.blog_comments(blog_id);
CREATE INDEX IF NOT EXISTS blog_related_products_blog_id_idx ON public.blog_related_products(blog_id);

-- RLS POLICIES
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_related_products ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
DROP POLICY IF EXISTS "Blog categories viewable by everyone" ON public.blog_categories;
CREATE POLICY "Blog categories viewable by everyone" ON public.blog_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Blog tags viewable by everyone" ON public.blog_tags;
CREATE POLICY "Blog tags viewable by everyone" ON public.blog_tags FOR SELECT USING (true);

DROP POLICY IF EXISTS "Published blogs viewable by everyone" ON public.blogs;
CREATE POLICY "Published blogs viewable by everyone" ON public.blogs FOR SELECT USING (status = 'published' OR (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')));

DROP POLICY IF EXISTS "Approved blog comments viewable by everyone" ON public.blog_comments;
CREATE POLICY "Approved blog comments viewable by everyone" ON public.blog_comments FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Blog related products viewable by everyone" ON public.blog_related_products;
CREATE POLICY "Blog related products viewable by everyone" ON public.blog_related_products FOR SELECT USING (true);

-- Admin Full Access Policies
DROP POLICY IF EXISTS "Admins full access to blog categories" ON public.blog_categories;
CREATE POLICY "Admins full access to blog categories" ON public.blog_categories FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Admins full access to blog tags" ON public.blog_tags;
CREATE POLICY "Admins full access to blog tags" ON public.blog_tags FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Admins full access to blogs" ON public.blogs;
CREATE POLICY "Admins full access to blogs" ON public.blogs FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Admins full access to blog comments" ON public.blog_comments;
CREATE POLICY "Admins full access to blog comments" ON public.blog_comments FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Admins full access to blog related products" ON public.blog_related_products;
CREATE POLICY "Admins full access to blog related products" ON public.blog_related_products FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Public Insert Policies for Views, Likes, and Comments
DROP POLICY IF EXISTS "Anyone can record a blog view" ON public.blog_views;
CREATE POLICY "Anyone can record a blog view" ON public.blog_views FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can like a blog post" ON public.blog_likes;
CREATE POLICY "Anyone can like a blog post" ON public.blog_likes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can post a blog comment" ON public.blog_comments;
CREATE POLICY "Anyone can post a blog comment" ON public.blog_comments FOR INSERT WITH CHECK (true);



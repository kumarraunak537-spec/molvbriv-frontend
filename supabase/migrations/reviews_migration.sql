-- MOLVBRIV PRODUCT RATINGS & REVIEWS SYSTEM MIGRATION

-- 1. Upgrade existing reviews table
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Create review media table for images/videos
CREATE TABLE IF NOT EXISTS public.review_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create review likes/helpful votes table
CREATE TABLE IF NOT EXISTS public.review_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_helpful BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- 4. Create review reports table for abuse reporting
CREATE TABLE IF NOT EXISTS public.review_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- 5. Create performance indexes for optimized queries
CREATE INDEX IF NOT EXISTS reviews_product_id_idx ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS reviews_status_idx ON public.reviews(status);
CREATE INDEX IF NOT EXISTS review_media_review_id_idx ON public.review_media(review_id);
CREATE INDEX IF NOT EXISTS review_likes_review_id_idx ON public.review_likes(review_id);
CREATE INDEX IF NOT EXISTS review_reports_review_id_idx ON public.review_reports(review_id);

-- 6. Setup reviews storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('reviews', 'reviews', true) ON CONFLICT DO NOTHING;

-- RLS policies for reviews storage bucket
DROP POLICY IF EXISTS "Review media is publicly viewable" ON storage.objects;
CREATE POLICY "Review media is publicly viewable" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'reviews');

DROP POLICY IF EXISTS "Authenticated users can upload review media" ON storage.objects;
CREATE POLICY "Authenticated users can upload review media" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'reviews' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete own review media" ON storage.objects;
CREATE POLICY "Users can delete own review media" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'reviews' AND auth.uid() = owner);

-- 7. Enable RLS on review tables
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;

-- 8. Setup RLS Policies for Reviews
DROP POLICY IF EXISTS "Anyone can read approved reviews" ON public.reviews;
CREATE POLICY "Anyone can read approved reviews" 
  ON public.reviews FOR SELECT 
  USING (status = 'approved' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON public.reviews;
CREATE POLICY "Authenticated users can insert reviews" 
  ON public.reviews FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
CREATE POLICY "Users can update own reviews" 
  ON public.reviews FOR UPDATE 
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users can delete own reviews or admin" ON public.reviews;
CREATE POLICY "Users can delete own reviews or admin" 
  ON public.reviews FOR DELETE 
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 9. Setup RLS Policies for Review Media
DROP POLICY IF EXISTS "Anyone can read review media" ON public.review_media;
CREATE POLICY "Anyone can read review media" 
  ON public.review_media FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert review media" ON public.review_media;
CREATE POLICY "Authenticated users can insert review media" 
  ON public.review_media FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete own review media" ON public.review_media;
CREATE POLICY "Users can delete own review media" 
  ON public.review_media FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.reviews WHERE id = review_media.review_id AND user_id = auth.uid()));

-- 10. Setup RLS Policies for Review Likes
DROP POLICY IF EXISTS "Anyone can view review likes count" ON public.review_likes;
CREATE POLICY "Anyone can view review likes count" 
  ON public.review_likes FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage review likes" ON public.review_likes;
CREATE POLICY "Authenticated users can manage review likes" 
  ON public.review_likes FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- 11. Setup RLS Policies for Review Reports
DROP POLICY IF EXISTS "Admins can view review reports" ON public.review_reports;
CREATE POLICY "Admins can view review reports" 
  ON public.review_reports FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Authenticated users can report reviews" ON public.review_reports;
CREATE POLICY "Authenticated users can report reviews" 
  ON public.review_reports FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

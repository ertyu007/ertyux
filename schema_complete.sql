-- =========================================================
-- COMPLETE SUPABASE DATABASE SCHEMA FOR 3D PORTFOLIO
-- Copy and run this entire script in Supabase SQL Editor
-- =========================================================

-- 1. Create projects table (supports multi-image gallery up to 5 images)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  image_urls TEXT[] DEFAULT '{}',
  demo_link TEXT,
  github_link TEXT,
  likes_count INT DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- If projects table already exists, ensure image_urls column is added:
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 2. Create RPC function for incrementing project likes
CREATE OR REPLACE FUNCTION increment_likes(project_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.projects 
  SET likes_count = COALESCE(likes_count, 0) + 1 
  WHERE id = project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create audit_logs table for Security & Monitoring
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('INFO', 'WARN', 'CRITICAL', 'ERROR')),
  ip_address TEXT,
  user_agent TEXT,
  path TEXT,
  method TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for high-performance log searching
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Fail-Closed RLS Policies for audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to prevent conflicts
DROP POLICY IF EXISTS "Deny public select" ON public.audit_logs;
DROP POLICY IF EXISTS "Deny public update" ON public.audit_logs;
DROP POLICY IF EXISTS "Deny public delete" ON public.audit_logs;
DROP POLICY IF EXISTS "Service role full access" ON public.audit_logs;

-- Block public access (Client API cannot read/modify logs)
CREATE POLICY "Deny public select" ON public.audit_logs FOR SELECT USING (false);
CREATE POLICY "Deny public update" ON public.audit_logs FOR UPDATE USING (false);
CREATE POLICY "Deny public delete" ON public.audit_logs FOR DELETE USING (false);

-- Allow server-side Service Role full access
CREATE POLICY "Service role full access" ON public.audit_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4. Enable RLS on projects table (Allow Public Read & Like, Admin Modify)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view projects" ON public.projects;
DROP POLICY IF EXISTS "Service role full access projects" ON public.projects;

CREATE POLICY "Public can view projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Service role full access projects" ON public.projects FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. Seed initial demo data (Optional)
INSERT INTO public.projects (title, description, image_url, image_urls, demo_link, github_link, likes_count, tags)
VALUES (
  'Cyberpunk E-Commerce', 
  'A fully functional 3D e-commerce store with AR capabilities and real-time product customizer.', 
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800', 
  ARRAY['https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800'],
  '#', 
  '#', 
  142,
  ARRAY['Next.js', 'Three.js', 'Web3']
)
ON CONFLICT DO NOTHING;

-- ==========================================
-- Sahel Resilience Stack - Core Admin Module (Supabase/Postgres)
-- ==========================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TABLE: forms (organization-defined submission forms)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.forms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    fields JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Enable RLS
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public forms view" ON public.forms;
DROP POLICY IF EXISTS "Admin forms modification" ON public.forms;

CREATE POLICY "Public forms view" ON public.forms FOR SELECT USING (is_active = true);
CREATE POLICY "Admin forms modification" ON public.forms FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ==========================================
-- TABLE: submissions (JSON payloads submitted to forms)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
    submitter_email TEXT NOT NULL,
    submitter_user_id TEXT,
    status TEXT NOT NULL DEFAULT 'Pending', -- Pending | Approved | Rejected
    cleared_at TIMESTAMP WITH TIME ZONE,
    cleared_by_email TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes (scale: thousands+ submissions)
CREATE INDEX IF NOT EXISTS submissions_form_id_created_at_idx ON public.submissions (form_id, created_at DESC);
CREATE INDEX IF NOT EXISTS submissions_status_created_at_idx ON public.submissions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS submissions_submitter_email_created_at_idx ON public.submissions (submitter_email, created_at DESC);

-- Enable RLS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public submission insert" ON public.submissions;
DROP POLICY IF EXISTS "Admin view submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admin clear submissions" ON public.submissions;
DROP POLICY IF EXISTS "User view own submissions" ON public.submissions;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Public submission insert" ON public.submissions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Admin view submissions" ON public.submissions FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admin clear submissions" ON public.submissions FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "User view own submissions" ON public.submissions FOR SELECT TO anon, authenticated USING (lower(submitter_email) = lower((auth.jwt() ->> 'email')::text));


-- ==========================================
-- TABLE: users
-- ==========================================
-- ==========================================
-- TABLE: users
-- ==========================================
-- Re-creating users table to support Firebase Auth (decoupled from Supabase Auth)
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text, -- Changed to TEXT to support Firebase UIDs or auto-generated IDs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    full_name TEXT,
    email TEXT UNIQUE, -- Ensure email is unique for lookups
    phone TEXT,
    role TEXT DEFAULT 'user'
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "User view own profile" ON public.users;
DROP POLICY IF EXISTS "User update own profile" ON public.users;

-- Allow anyone to read users (needed for admin checks via RPC) or restrict as needed
CREATE POLICY "User view own profile" ON public.users FOR SELECT TO anon, authenticated USING (true);

-- No default admin is seeded in open-source distribution.
-- Create an admin by inserting/updating `public.users.role = 'admin'` in your deployment.

-- Trigger (Optional: Only works if you were using Supabase Auth, keeping for reference but likely unused with Firebase)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id::text, new.email, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (email) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- SAMPLE DATA (generic)
-- ==========================================
INSERT INTO public.forms (name, description, is_active, fields)
SELECT
  'Field Incident Report',
  'Universal incident intake form for field teams (offline-friendly).',
  true,
  '[
    {"key":"full_name","label":"Full Name","type":"text","required":true},
    {"key":"phone","label":"Phone","type":"text","required":true},
    {"key":"region","label":"Region","type":"text","required":true},
    {"key":"incident_type","label":"Incident Type","type":"select","required":true,"options":["Safety","Logistics","Health","Security","Other"]},
    {"key":"summary","label":"Summary","type":"textarea","required":true},
    {"key":"occurred_on","label":"Occurred On","type":"date","required":false}
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.forms WHERE name = 'Field Incident Report');

-- ==========================================
-- RPC FUNCTION (Fix for Firebase Auth + Supabase RLS)
-- ==========================================
-- Since users are authenticated via Firebase, they appear as 'anon' to Supabase.
-- This function allows the console to fetch the latest record by email.

CREATE OR REPLACE FUNCTION public.get_latest_submission_by_email(email_input TEXT)
RETURNS SETOF public.submissions AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.submissions
  WHERE submitter_email ILIKE email_input
  ORDER BY created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to anon (Firebase users)
GRANT EXECUTE ON FUNCTION public.get_latest_submission_by_email(TEXT) TO anon;

-- ==========================================
-- RPC FUNCTION (Admin Access for Firebase Auth)
-- ==========================================
-- Allows fetching all records if the email belongs to an admin.
CREATE OR REPLACE FUNCTION public.get_submissions_for_admin(admin_email TEXT)
RETURNS SETOF public.submissions AS $$
BEGIN
  -- Check if the user exists and is an admin
  IF EXISTS (SELECT 1 FROM public.users WHERE email = admin_email AND role = 'admin') THEN
    RETURN QUERY SELECT * FROM public.submissions ORDER BY created_at DESC;
  ELSE
    -- Return empty set if not admin
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_submissions_for_admin(TEXT) TO anon;

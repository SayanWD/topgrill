-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Implements RBAC: admin (full access), analyst (read/write), viewer (read only)

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics_daily ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if user is analyst or above
CREATE OR REPLACE FUNCTION public.is_analyst_or_above()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'analyst')
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- =====================================================
-- COMPANIES POLICIES
-- =====================================================

-- All authenticated users can read companies
CREATE POLICY "Authenticated users can view companies"
  ON public.companies FOR SELECT
  USING (auth.role() = 'authenticated');

-- Analysts and admins can insert/update/delete
CREATE POLICY "Analysts can manage companies"
  ON public.companies FOR ALL
  USING (public.is_analyst_or_above())
  WITH CHECK (public.is_analyst_or_above());

-- =====================================================
-- CONTACTS POLICIES
-- =====================================================

CREATE POLICY "Authenticated users can view contacts"
  ON public.contacts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Analysts can manage contacts"
  ON public.contacts FOR ALL
  USING (public.is_analyst_or_above())
  WITH CHECK (public.is_analyst_or_above());

-- =====================================================
-- DEALS POLICIES
-- =====================================================

CREATE POLICY "Authenticated users can view deals"
  ON public.deals FOR SELECT
  USING (auth.role() = 'authenticated');

-- Analysts can see all deals
-- Sales reps can see only their own deals (optional - uncomment if needed)
-- CREATE POLICY "Sales reps can view own deals"
--   ON public.deals FOR SELECT
--   USING (auth.uid() = owner_id OR public.is_analyst_or_above());

CREATE POLICY "Analysts can manage deals"
  ON public.deals FOR ALL
  USING (public.is_analyst_or_above())
  WITH CHECK (public.is_analyst_or_above());

-- =====================================================
-- ACTIVITIES POLICIES
-- =====================================================

CREATE POLICY "Authenticated users can view activities"
  ON public.activities FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Analysts can manage activities"
  ON public.activities FOR ALL
  USING (public.is_analyst_or_above())
  WITH CHECK (public.is_analyst_or_above());

-- =====================================================
-- EVENTS POLICIES
-- =====================================================

-- Events are read-only for most users
CREATE POLICY "Authenticated users can view events"
  ON public.events FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only analysts and admins can insert events (via API)
CREATE POLICY "Analysts can insert events"
  ON public.events FOR INSERT
  WITH CHECK (public.is_analyst_or_above());

-- Only admins can delete events (for cleanup)
CREATE POLICY "Admins can delete events"
  ON public.events FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- METRICS_DAILY POLICIES
-- =====================================================

-- Everyone can read metrics
CREATE POLICY "Authenticated users can view metrics"
  ON public.metrics_daily FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only system (service role) can write metrics
-- No user policy needed - handled via service role key

-- =====================================================
-- SECURITY NOTES
-- =====================================================
-- 
-- 1. Service Role Key bypasses RLS - use ONLY in secure server contexts
-- 2. Webhook endpoints should use service role key after validating signatures
-- 3. Client-side queries automatically respect RLS via anon key
-- 4. Background jobs (aggregations) use service role key
-- 5. For multi-tenancy, add tenant_id column and filter policies accordingly


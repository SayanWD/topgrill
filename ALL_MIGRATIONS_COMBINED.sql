-- =====================================================
-- INITIAL SCHEMA: CRM Analytics Database
-- =====================================================
-- Creates core tables for CRM data ingestion and analytics
-- Optimized for read-heavy workloads with proper indexes

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =====================================================
-- PROFILES TABLE (User Management)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'analyst', 'viewer'))
);

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- =====================================================
-- COMPANIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  external_id TEXT UNIQUE, -- CRM system ID
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  size TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_companies_external_id ON public.companies(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_companies_domain ON public.companies(domain) WHERE domain IS NOT NULL;
CREATE INDEX idx_companies_name ON public.companies USING gin(to_tsvector('english', name));

-- =====================================================
-- CONTACTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  external_id TEXT UNIQUE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  source TEXT, -- where contact came from (web, referral, etc)
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced', 'deleted')),
  lifecycle_stage TEXT, -- lead, mql, sql, customer, etc
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_contacts_external_id ON public.contacts(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_contacts_email ON public.contacts(email);
CREATE INDEX idx_contacts_company_id ON public.contacts(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_contacts_status ON public.contacts(status);
CREATE INDEX idx_contacts_lifecycle_stage ON public.contacts(lifecycle_stage) WHERE lifecycle_stage IS NOT NULL;
CREATE INDEX idx_contacts_created_at ON public.contacts(created_at DESC);
CREATE INDEX idx_contacts_metadata ON public.contacts USING gin(metadata);

-- =====================================================
-- DEALS TABLE (Sales Pipeline)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  external_id TEXT UNIQUE,
  name TEXT NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  stage TEXT NOT NULL, -- qualified, proposal, negotiation, closed-won, closed-lost
  probability INTEGER NOT NULL DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  close_date DATE,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_deals_external_id ON public.deals(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_deals_contact_id ON public.deals(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX idx_deals_company_id ON public.deals(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_deals_owner_id ON public.deals(owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX idx_deals_stage ON public.deals(stage);
CREATE INDEX idx_deals_close_date ON public.deals(close_date) WHERE close_date IS NOT NULL;
CREATE INDEX idx_deals_amount ON public.deals(amount DESC);
CREATE INDEX idx_deals_created_at ON public.deals(created_at DESC);

-- =====================================================
-- ACTIVITIES TABLE (Interactions)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activity_type TEXT NOT NULL, -- email, call, meeting, note, task
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject TEXT,
  body TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_activities_contact_id ON public.activities(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX idx_activities_deal_id ON public.activities(deal_id) WHERE deal_id IS NOT NULL;
CREATE INDEX idx_activities_user_id ON public.activities(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_activities_type ON public.activities(activity_type);
CREATE INDEX idx_activities_created_at ON public.activities(created_at DESC);

-- =====================================================
-- EVENTS TABLE (Web & Marketing Events)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL, -- pageview, click, conversion, form_submit, etc
  source TEXT NOT NULL, -- fb, google, organic, direct, etc
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  session_id TEXT,
  user_agent TEXT,
  ip_address INET,
  properties JSONB DEFAULT '{}'::jsonb,
  idempotency_key TEXT UNIQUE -- For deduplication
);

CREATE INDEX idx_events_contact_id ON public.events(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX idx_events_event_name ON public.events(event_name);
CREATE INDEX idx_events_event_type ON public.events(event_type);
CREATE INDEX idx_events_source ON public.events(source);
CREATE INDEX idx_events_session_id ON public.events(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_events_created_at ON public.events(created_at DESC);
CREATE INDEX idx_events_idempotency_key ON public.events(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_events_properties ON public.events USING gin(properties);

-- Partition events by month for better performance
-- (This is a simplified version; production would use declarative partitioning)

-- =====================================================
-- METRICS_DAILY TABLE (Aggregated Metrics)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.metrics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(15, 2) NOT NULL,
  dimensions JSONB DEFAULT '{}'::jsonb, -- For grouping (source, campaign, etc)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_metrics_daily_unique ON public.metrics_daily(date, metric_name, dimensions);
CREATE INDEX idx_metrics_daily_date ON public.metrics_daily(date DESC);
CREATE INDEX idx_metrics_daily_metric_name ON public.metrics_daily(metric_name);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Auto-create profile on signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'viewer' -- default role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

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

-- =====================================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- =====================================================
-- Pre-aggregated views for fast dashboard queries
-- Refresh via CRON job (see /api/cron/aggregate-metrics)

-- =====================================================
-- MV: CONTACTS BY SOURCE
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_contacts_by_source AS
SELECT
  source,
  lifecycle_stage,
  DATE_TRUNC('day', created_at) AS date,
  COUNT(*) AS count,
  COUNT(DISTINCT company_id) AS unique_companies
FROM public.contacts
WHERE status = 'active'
GROUP BY source, lifecycle_stage, DATE_TRUNC('day', created_at);

CREATE UNIQUE INDEX ON public.mv_contacts_by_source(source, lifecycle_stage, date);

-- =====================================================
-- MV: DEALS PIPELINE
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_deals_pipeline AS
SELECT
  stage,
  DATE_TRUNC('day', created_at) AS date,
  COUNT(*) AS deal_count,
  SUM(amount) AS total_value,
  AVG(amount) AS avg_deal_size,
  AVG(probability) AS avg_probability,
  SUM(amount * probability / 100.0) AS weighted_value
FROM public.deals
GROUP BY stage, DATE_TRUNC('day', created_at);

CREATE UNIQUE INDEX ON public.mv_deals_pipeline(stage, date);

-- =====================================================
-- MV: CONVERSION FUNNEL
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_conversion_funnel AS
WITH funnel_stages AS (
  SELECT
    DATE_TRUNC('day', created_at) AS date,
    lifecycle_stage,
    COUNT(*) AS contacts
  FROM public.contacts
  WHERE lifecycle_stage IS NOT NULL
  GROUP BY DATE_TRUNC('day', created_at), lifecycle_stage
)
SELECT
  date,
  COALESCE(SUM(CASE WHEN lifecycle_stage = 'lead' THEN contacts END), 0) AS leads,
  COALESCE(SUM(CASE WHEN lifecycle_stage = 'mql' THEN contacts END), 0) AS mql,
  COALESCE(SUM(CASE WHEN lifecycle_stage = 'sql' THEN contacts END), 0) AS sql,
  COALESCE(SUM(CASE WHEN lifecycle_stage = 'opportunity' THEN contacts END), 0) AS opportunities,
  COALESCE(SUM(CASE WHEN lifecycle_stage = 'customer' THEN contacts END), 0) AS customers
FROM funnel_stages
GROUP BY date;

CREATE UNIQUE INDEX ON public.mv_conversion_funnel(date);

-- =====================================================
-- MV: REVENUE BY MONTH
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_revenue_by_month AS
SELECT
  DATE_TRUNC('month', close_date) AS month,
  stage,
  COUNT(*) AS deals_closed,
  SUM(amount) AS revenue,
  AVG(amount) AS avg_deal_size
FROM public.deals
WHERE close_date IS NOT NULL
  AND stage IN ('closed-won', 'closed-lost')
GROUP BY DATE_TRUNC('month', close_date), stage;

CREATE UNIQUE INDEX ON public.mv_revenue_by_month(month, stage);

-- =====================================================
-- MV: TOP PERFORMING SOURCES
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_top_sources AS
WITH source_metrics AS (
  SELECT
    c.source,
    COUNT(DISTINCT c.id) AS total_contacts,
    COUNT(DISTINCT CASE WHEN c.lifecycle_stage IN ('customer') THEN c.id END) AS converted_contacts,
    COUNT(DISTINCT d.id) AS total_deals,
    COALESCE(SUM(CASE WHEN d.stage = 'closed-won' THEN d.amount ELSE 0 END), 0) AS revenue
  FROM public.contacts c
  LEFT JOIN public.deals d ON d.contact_id = c.id
  WHERE c.source IS NOT NULL
  GROUP BY c.source
)
SELECT
  source,
  total_contacts,
  converted_contacts,
  CASE
    WHEN total_contacts > 0 THEN ROUND((converted_contacts::DECIMAL / total_contacts) * 100, 2)
    ELSE 0
  END AS conversion_rate,
  total_deals,
  revenue,
  CASE
    WHEN total_contacts > 0 THEN ROUND(revenue / total_contacts, 2)
    ELSE 0
  END AS revenue_per_contact
FROM source_metrics;

CREATE UNIQUE INDEX ON public.mv_top_sources(source);

-- =====================================================
-- MV: ACTIVITY TIMELINE
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_activity_timeline AS
SELECT
  DATE_TRUNC('day', created_at) AS date,
  activity_type,
  COUNT(*) AS activity_count,
  COUNT(DISTINCT contact_id) AS unique_contacts,
  COUNT(DISTINCT user_id) AS unique_users
FROM public.activities
GROUP BY DATE_TRUNC('day', created_at), activity_type;

CREATE UNIQUE INDEX ON public.mv_activity_timeline(date, activity_type);

-- =====================================================
-- FUNCTION: REFRESH ALL MATERIALIZED VIEWS
-- =====================================================
CREATE OR REPLACE FUNCTION public.refresh_all_mv()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_contacts_by_source;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_deals_pipeline;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_conversion_funnel;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_revenue_by_month;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_top_sources;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_activity_timeline;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT SELECT ON public.mv_contacts_by_source TO authenticated;
GRANT SELECT ON public.mv_deals_pipeline TO authenticated;
GRANT SELECT ON public.mv_conversion_funnel TO authenticated;
GRANT SELECT ON public.mv_revenue_by_month TO authenticated;
GRANT SELECT ON public.mv_top_sources TO authenticated;
GRANT SELECT ON public.mv_activity_timeline TO authenticated;

-- =====================================================
-- INTEGRATIONS TABLE
-- =====================================================
-- Stores OAuth tokens and integration settings for CRM systems

CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- User who connected this integration
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Integration details
  provider TEXT NOT NULL, -- amocrm, hubspot, salesforce, etc
  provider_account_id TEXT, -- Account ID in external system (subdomain, org ID, etc)
  
  -- OAuth credentials (encrypted in production!)
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Integration settings
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'error')),
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  
  -- Unique per user+provider
  UNIQUE(user_id, provider, provider_account_id)
);

CREATE INDEX idx_integrations_user_id ON public.integrations(user_id);
CREATE INDEX idx_integrations_provider ON public.integrations(provider);
CREATE INDEX idx_integrations_status ON public.integrations(status);
CREATE INDEX idx_integrations_expires ON public.integrations(token_expires_at) WHERE token_expires_at IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS POLICIES FOR INTEGRATIONS
-- =====================================================

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Users can view their own integrations
CREATE POLICY "users_view_own_integrations"
  ON public.integrations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own integrations
CREATE POLICY "users_insert_own_integrations"
  ON public.integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own integrations
CREATE POLICY "users_update_own_integrations"
  ON public.integrations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own integrations
CREATE POLICY "users_delete_own_integrations"
  ON public.integrations FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all integrations
CREATE POLICY "admins_view_all_integrations"
  ON public.integrations FOR SELECT
  USING (public.is_admin());

-- =====================================================
-- FUNCTION: Get active integration
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_active_integration(
  p_provider TEXT,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  id UUID,
  access_token TEXT,
  refresh_token TEXT,
  settings JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.access_token,
    i.refresh_token,
    i.settings
  FROM public.integrations i
  WHERE i.user_id = p_user_id
    AND i.provider = p_provider
    AND i.status = 'active'
    AND (i.token_expires_at IS NULL OR i.token_expires_at > NOW())
  ORDER BY i.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SEED DATA FOR TESTING
-- =====================================================

-- Insert test companies
INSERT INTO public.companies (id, name, domain, industry, size) VALUES
('11111111-1111-1111-1111-111111111111', 'Acme Corporation', 'acme.com', 'Technology', '51-200'),
('22222222-2222-2222-2222-222222222222', 'Global Industries', 'global.com', 'Manufacturing', '201-500'),
('33333333-3333-3333-3333-333333333333', 'Tech Startup Inc', 'techstartup.io', 'Software', '11-50');

-- Insert test contacts
INSERT INTO public.contacts (id, email, first_name, last_name, company_id, source, status, lifecycle_stage) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'john@acme.com', 'John', 'Doe', '11111111-1111-1111-1111-111111111111', 'website', 'active', 'lead'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'jane@global.com', 'Jane', 'Smith', '22222222-2222-2222-2222-222222222222', 'referral', 'active', 'mql'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'bob@techstartup.io', 'Bob', 'Johnson', '33333333-3333-3333-3333-333333333333', 'google', 'active', 'sql'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'alice@acme.com', 'Alice', 'Williams', '11111111-1111-1111-1111-111111111111', 'linkedin', 'active', 'opportunity'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'charlie@global.com', 'Charlie', 'Brown', '22222222-2222-2222-2222-222222222222', 'facebook', 'active', 'customer');

-- Insert test deals
INSERT INTO public.deals (id, name, contact_id, company_id, amount, currency, stage, probability, close_date) VALUES
('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'Acme Enterprise Deal', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 50000.00, 'USD', 'qualified', 30, '2024-06-30'),
('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 'Global Manufacturing Contract', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 120000.00, 'USD', 'proposal', 60, '2024-05-15'),
('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', 'Tech Startup SaaS', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 25000.00, 'USD', 'negotiation', 80, '2024-04-20'),
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'Acme Renewal', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 75000.00, 'USD', 'closed-won', 100, '2024-03-10');

-- Insert test activities
INSERT INTO public.activities (activity_type, contact_id, subject, body) VALUES
('email', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Introduction Email', 'Sent initial outreach email to John'),
('call', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Discovery Call', 'Had 30-minute discovery call with Jane'),
('meeting', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Demo Presentation', 'Presented product demo to Bob and team'),
('email', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Follow-up', 'Sent proposal and pricing to Alice'),
('note', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Customer Success Check-in', 'Charlie reported high satisfaction');

-- Insert test events
INSERT INTO public.events (event_name, event_type, source, contact_id, session_id, properties) VALUES
('page_view', 'pageview', 'organic', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'sess_001', '{"page": "/pricing", "referrer": "google.com"}'),
('button_click', 'click', 'facebook', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'sess_002', '{"button": "Request Demo", "campaign": "fb_retarget"}'),
('form_submit', 'conversion', 'linkedin', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'sess_003', '{"form": "contact_us", "utm_source": "linkedin"}'),
('video_play', 'engagement', 'website', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'sess_004', '{"video": "product_intro", "duration": 120}'),
('purchase', 'conversion', 'referral', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'sess_005', '{"amount": 75000, "plan": "enterprise"}');

-- Insert test metrics
INSERT INTO public.metrics_daily (date, metric_name, metric_value, dimensions) VALUES
(CURRENT_DATE - INTERVAL '7 days', 'leads', 45, '{"source": "website"}'),
(CURRENT_DATE - INTERVAL '7 days', 'leads', 23, '{"source": "facebook"}'),
(CURRENT_DATE - INTERVAL '7 days', 'revenue', 125000, '{"stage": "closed-won"}'),
(CURRENT_DATE - INTERVAL '6 days', 'leads', 52, '{"source": "website"}'),
(CURRENT_DATE - INTERVAL '6 days', 'leads', 28, '{"source": "facebook"}'),
(CURRENT_DATE - INTERVAL '6 days', 'revenue', 89000, '{"stage": "closed-won"}'),
(CURRENT_DATE - INTERVAL '5 days', 'leads', 38, '{"source": "website"}'),
(CURRENT_DATE - INTERVAL '5 days', 'leads', 31, '{"source": "google"}'),
(CURRENT_DATE - INTERVAL '5 days', 'revenue', 156000, '{"stage": "closed-won"}');


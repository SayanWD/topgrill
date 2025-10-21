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


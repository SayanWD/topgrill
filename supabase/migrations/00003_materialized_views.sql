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


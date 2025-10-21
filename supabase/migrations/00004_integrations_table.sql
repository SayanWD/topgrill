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


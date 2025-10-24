-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'new',
    email TEXT,
    phone TEXT,
    first_name TEXT,
    last_name TEXT,
    value DECIMAL(10,2) DEFAULT 0,
    facebook_sent BOOLEAN DEFAULT FALSE,
    custom_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead_events table for logging
CREATE TABLE IF NOT EXISTS public.lead_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id TEXT NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_lead_events_lead_id ON public.lead_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_event_type ON public.lead_events(event_type);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (with IF NOT EXISTS check)
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
    DROP POLICY IF EXISTS "Users can insert their own leads" ON public.leads;
    DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
    DROP POLICY IF EXISTS "Users can view their own lead events" ON public.lead_events;
    DROP POLICY IF EXISTS "Users can insert their own lead events" ON public.lead_events;
    
    -- Create new policies
    CREATE POLICY "Users can view their own leads" ON public.leads
        FOR SELECT USING (auth.uid() IS NOT NULL);

    CREATE POLICY "Users can insert their own leads" ON public.leads
        FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

    CREATE POLICY "Users can update their own leads" ON public.leads
        FOR UPDATE USING (auth.uid() IS NOT NULL);

    CREATE POLICY "Users can view their own lead events" ON public.lead_events
        FOR SELECT USING (auth.uid() IS NOT NULL);

    CREATE POLICY "Users can insert their own lead events" ON public.lead_events
        FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
END $$;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at 
    BEFORE UPDATE ON public.leads 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

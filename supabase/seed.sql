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


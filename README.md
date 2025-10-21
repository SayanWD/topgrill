# 🚀 TopGrill CRM Analytics

**Production-ready CRM data analytics platform with universal import capabilities**

## ✨ Features

- **🔗 Universal CRM Integration** - HubSpot, Salesforce, amoCRM, CSV/XLSX
- **📊 Real-time Analytics** - Dashboard with live updates and metrics
- **🔐 Secure OAuth 2.0** - Automatic token refresh and webhook handling
- **📥 Smart Import Wizard** - Field mapping, deduplication, validation
- **🎯 Role-based Access** - Multi-user support with RBAC
- **⚡ Production Ready** - Vercel deployment, comprehensive testing

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, Postgres, Storage, Edge Functions)
- **State**: Zustand, TanStack Query
- **Forms**: React Hook Form, Zod validation
- **Testing**: Jest, Playwright, 98% coverage
- **Deploy**: Vercel, CI/CD with GitHub Actions

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Clone repository
git clone https://github.com/SayanWD/topgrill.git
cd topgrill

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Configure your credentials in .env.local
```

### 2. Supabase Setup

```bash
# Apply database migrations
# Run ALL_MIGRATIONS_COMBINED.sql in Supabase SQL Editor

# Seed test data (optional)
# Run supabase/seed.sql
```

### 3. Development

```bash
# Start development server
npm run dev

# Open http://localhost:3100
```

## 🔧 CRM Integrations

### amoCRM Integration

1. **Create integration** in amoCRM dashboard
2. **Configure OAuth URLs**:
   - Redirect URI: `https://yourdomain.com/api/oauth/amocrm/callback`
   - Webhook: `https://yourdomain.com/api/webhooks/amocrm/disconnect`
3. **Set permissions**: Contacts, Companies, Deals (Read)
4. **Connect via UI**: `/integrations` → Connect amoCRM

### CSV Import

1. **Prepare CSV file** with headers
2. **Upload via wizard**: `/import` → CSV Upload
3. **Map fields** to standard schema
4. **Review and import** with deduplication

## 📊 API Endpoints

### CRM Integration
- `GET /api/oauth/amocrm` - Start OAuth flow
- `GET /api/oauth/amocrm/callback` - OAuth callback
- `GET /api/webhooks/amocrm/disconnect` - Disconnect webhook

### Data Import
- `POST /api/import/crm` - Start CRM import
- `POST /api/import/csv` - Analyze CSV file
- `POST /api/integrations/[id]/sync` - Manual sync

### Analytics
- `GET /api/analytics/metrics` - Dashboard metrics
- `GET /api/contacts` - Contact management
- `GET /api/companies` - Company management

## 🧪 Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests
npm run test:all
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect repository** to Vercel
2. **Configure environment variables**:
   ```bash
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   AMOCRM_CLIENT_ID=your_client_id
   AMOCRM_CLIENT_SECRET=your_client_secret
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   ```
3. **Deploy**: Automatic on push to main

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   └── api/               # API routes
├── components/            # React components
│   ├── analytics/         # Analytics components
│   ├── auth/              # Authentication components
│   ├── integrations/      # CRM integration components
│   └── ui/                # UI components (shadcn/ui)
├── lib/                   # Utilities and services
│   ├── crm-adapters/      # CRM integration adapters
│   ├── supabase/          # Supabase client and types
│   └── services/          # Business logic services
├── supabase/              # Database migrations and functions
├── tests/                 # Test suites
└── docs/                  # Documentation
```

## 🔐 Security

- **OAuth 2.0** with automatic token refresh
- **HMAC signature** verification for webhooks
- **Row Level Security** (RLS) in Supabase
- **CSRF protection** with state parameters
- **Rate limiting** for API endpoints
- **Input validation** with Zod schemas

## 📈 Monitoring

- **Vercel Analytics** for performance monitoring
- **Supabase Dashboard** for database monitoring
- **Error tracking** with detailed logging
- **Health checks** for all integrations

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check `/docs` folder
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

---

**Built with ❤️ for CRM data analytics**

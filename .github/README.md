# GitHub Actions Workflows

This directory contains GitHub Actions workflows for the TopGrill CRM project.

## Workflows

### 1. CI/CD Pipeline (`ci.yml`)
- **Triggers**: Push to `main`/`develop`, Pull Requests to `main`
- **Jobs**:
  - `lint-and-test`: Runs linting, type checking, tests, and build
  - `deploy`: Deploys to Vercel (only on `main` branch)

### 2. Vercel Deployment (`vercel-deploy.yml`)
- **Triggers**: Push to `main`, Pull Requests to `main`
- **Jobs**:
  - `lint`: Runs ESLint
  - `build`: Builds the application
  - `deploy`: Deploys to Vercel (only on `main` branch)

### 3. Vercel Status Updates (`vercel-status.yml`)
- **Triggers**: When CI/CD Pipeline completes
- **Purpose**: Notifies Vercel of workflow status

## Required Secrets

Add these secrets to your GitHub repository settings:

### Vercel Secrets
- `VERCEL_TOKEN`: Your Vercel API token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

### How to get Vercel secrets:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Go to Settings → Tokens
3. Create a new token
4. Get your Org ID and Project ID from your project settings

## Vercel Notifications

The workflows include Vercel notification steps that update Vercel with the status of:
- Linting checks
- Build status
- Deployment status

This helps Vercel track the health of your deployments and provides better integration between GitHub Actions and Vercel.

## Node.js Version

The workflows use Node.js 22.x as specified in the project's `engines` field and `.nvmrc` file.

## Environment Variables

Make sure to set up the following environment variables in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AMOCRM_CLIENT_ID`
- `AMOCRM_CLIENT_SECRET`
- `AMOCRM_LONG_TERM_TOKEN`
- `NEXT_PUBLIC_FB_PIXEL_ID`
- `FB_CONVERSION_ACCESS_TOKEN`
- `CRON_SECRET`

# 📚 Deployment Guide

## Table of Contents

1. [Quick Commands](#quick-commands)
2. [Development Workflow](#development-workflow)
3. [Deployment Process](#deployment-process)
4. [Environment Variables](#environment-variables)
5. [Database Management](#database-management)
6. [Troubleshooting](#troubleshooting)
7. [Rollback Procedures](#rollback-procedures)
8. [Emergency Contacts](#emergency-contacts)

---

## Quick Commands

### Local Development

```bash
# Start development server
npm run dev

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Run tests
npm test

# Open Prisma Studio
npm run studio
```

### Deployment Commands

```bash
# Deploy to staging (preview)
git checkout staging
git push origin staging
# OR
vercel

# Deploy to production
git checkout main
git merge staging
git push origin main
# OR
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs
```

---

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch from staging
git checkout staging
git pull origin staging
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat: your feature description"

# Push feature branch
git push origin feature/your-feature
```

### 2. Testing on Staging

```bash
# Merge to staging
git checkout staging
git merge feature/your-feature
git push origin staging

# Vercel automatically deploys to preview
# Test at: https://gogentic-portal-real-[hash].vercel.app
```

### 3. Production Deployment

```bash
# After testing on staging
git checkout main
git merge staging
git push origin main

# Vercel automatically deploys to production
# Live at: https://gogentic-portal-real.vercel.app
```

---

## Deployment Process

### Automatic Deployments (CI/CD)

The project uses GitHub Actions for CI/CD:

1. **On Pull Request**:
   - Runs linting
   - Runs type checking
   - Runs tests
   - Deploys preview to Vercel

2. **On Push to Staging**:
   - All PR checks
   - Deploys to staging environment

3. **On Push to Main**:
   - All PR checks
   - Deploys to production
   - Creates Sentry release

### Manual Deployment

If automatic deployment fails:

```bash
# For staging
vercel

# For production (BE CAREFUL!)
vercel --prod
```

---

## Environment Variables

### Required Variables

#### Production (`vercel env pull .env.production`)

```env
DATABASE_URL=postgresql://...@ep-floral-cherry-adhjhwsk-pooler.c-2.us-east-1.aws.neon.tech/...
DIRECT_URL=postgresql://...@ep-floral-cherry-adhjhwsk.c-2.us-east-1.aws.neon.tech/...
NEXTAUTH_URL=https://gogentic-portal-real.vercel.app
NEXTAUTH_SECRET=[generate with: openssl rand -base64 32]
AUTH_GOOGLE_ID=[from Google Console]
AUTH_GOOGLE_SECRET=[from Google Console]
```

#### Staging/Preview

```env
DATABASE_URL=postgresql://...@ep-bitter-cherry-afefqdek-pooler.c-2.us-west-2.aws.neon.tech/...
DIRECT_URL=postgresql://...@ep-bitter-cherry-afefqdek.c-2.us-west-2.aws.neon.tech/...
NEXTAUTH_URL=https://gogentic-portal-real-[hash].vercel.app
NEXTAUTH_SECRET=[same as production or different]
```

### Managing Environment Variables

```bash
# List all env vars
vercel env ls

# Add new variable
vercel env add VARIABLE_NAME

# Remove variable
vercel env rm VARIABLE_NAME

# Pull env vars locally
vercel env pull .env.local
```

---

## Database Management

### Neon Databases

- **Production**: gogenticboard (us-east-1)
- **Staging**: gogentic-portal-staging (us-west-2)

### Database Migrations

```bash
# Create migration (development)
npm run migrate:dev

# Apply migrations (production)
npm run migrate:deploy

# Reset database (DANGEROUS!)
npx prisma migrate reset

# Sync schema without migration
npx prisma db push
```

### Data Backup

```bash
# Backup production data
pg_dump $PROD_DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore to staging
psql $STAGING_DATABASE_URL < backup_20250912.sql
```

---

## Troubleshooting

### Common Issues

#### 1. Build Failures

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

#### 2. Database Connection Issues

```bash
# Test connection
npx prisma db pull

# Reset Prisma client
npx prisma generate
```

#### 3. Authentication Issues

```bash
# Verify env vars
vercel env ls

# Check NextAuth configuration
npm run dev # Check console for auth errors
```

#### 4. Deployment Stuck

```bash
# Cancel deployment
vercel rm [deployment-url]

# Force redeploy
vercel --force
```

### Viewing Logs

```bash
# Vercel logs
vercel logs --follow

# Specific deployment
vercel logs [deployment-url]

# Production errors (Sentry)
# Go to: https://sentry.io/organizations/gogentic/projects/portal
```

---

## Rollback Procedures

### Quick Rollback (Vercel)

1. Go to: https://vercel.com/ians-projects-d5107473/gogentic-portal-real
2. Click on "Deployments" tab
3. Find last working deployment
4. Click "..." menu → "Promote to Production"

### Git Rollback

```bash
# Find last working commit
git log --oneline -10

# Revert to specific commit
git checkout main
git revert HEAD
git push origin main

# OR reset (DANGEROUS - loses history)
git reset --hard [commit-hash]
git push --force origin main
```

### Database Rollback

```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back

# Restore from backup
psql $DATABASE_URL < backup_20250912.sql
```

---

## Emergency Contacts

### Critical Issues

1. **Site Down**:
   - Check: https://vercel.com/status
   - Check: https://neon.tech/status
2. **Data Loss**:
   - Neon backups: Automatic 24hr retention
   - Contact Neon support: support@neon.tech

3. **Security Breach**:
   - Rotate all secrets immediately
   - Check Sentry for suspicious activity
   - Review GitHub audit log

### Support Channels

- **Vercel Support**: https://vercel.com/support
- **Neon Support**: https://neon.tech/support
- **GitHub Issues**: https://github.com/iangogentic/gogentictaskboard/issues

---

## Best Practices

### Before Deploying

- [ ] Run `npm run lint`
- [ ] Run `npm test`
- [ ] Test locally with production data (carefully!)
- [ ] Check for console errors
- [ ] Review environment variables

### After Deploying

- [ ] Check deployment URL works
- [ ] Test critical user flows
- [ ] Monitor Sentry for new errors
- [ ] Check performance metrics

### Security Checklist

- [ ] No secrets in code
- [ ] Environment variables secure
- [ ] Dependencies updated (`npm audit`)
- [ ] HTTPS enforced
- [ ] Auth working correctly

---

## Monitoring & Analytics

### Sentry (Error Tracking)

- URL: https://sentry.io/organizations/gogentic/projects/portal
- Alerts: Set up for error rate spikes

### Vercel Analytics

- URL: https://vercel.com/ians-projects-d5107473/gogentic-portal-real/analytics
- Metrics: Page views, performance, web vitals

### Database Monitoring

- Neon Dashboard: https://console.neon.tech
- Metrics: Query performance, storage, connections

---

## CI/CD Pipeline

The project uses GitHub Actions for automated testing and deployment.

### Pipeline Stages

1. **Lint & Type Check** - Ensures code quality
2. **Test** - Runs test suite
3. **Build** - Creates production build
4. **Deploy** - Deploys to appropriate environment
5. **Security Scan** - Checks for vulnerabilities

### Required GitHub Secrets

Add these in: Settings → Secrets and variables → Actions

```yaml
VERCEL_TOKEN         # From vercel.com/account/tokens
VERCEL_ORG_ID        # team_lV9UhkXVQAG9skK6C17UWfbo
VERCEL_PROJECT_ID    # prj_nSQ3rhqChEpoP9nNLmpKlGepGhd9
DATABASE_URL         # Production database
NEXTAUTH_SECRET      # Auth secret
SENTRY_AUTH_TOKEN    # Optional - for source maps
```

---

## Appendix

### Project Structure

```
gogentic-portal-production/
├── app/              # Next.js app directory
├── components/       # React components
├── lib/             # Utility functions
├── prisma/          # Database schema
├── public/          # Static assets
├── .github/         # GitHub Actions
├── .husky/          # Git hooks
└── types/           # TypeScript types
```

### Technology Stack

- **Framework**: Next.js 15.5
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Auth**: NextAuth.js
- **Hosting**: Vercel
- **Monitoring**: Sentry
- **CI/CD**: GitHub Actions

---

_Last Updated: 2025-09-12_
_Maintained by: Gogentic Team_

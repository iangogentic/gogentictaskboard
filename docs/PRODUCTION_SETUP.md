# Production Setup Guide

## ✅ Acceptance Checklist

- [ ] Vercel envs set for **all** environments with pooled/direct URLs
- [ ] `schema.prisma` has `directUrl` for migrations
- [ ] SQLite artifacts removed from repo
- [ ] One clean Postgres init migration exists and is resolved/applied
- [ ] `/api/health` returns `{ ok: true }`
- [ ] Core smoke Playwright tests pass
- [ ] Caching via tag revalidation works
- [ ] Password middleware active (until real auth)
- [ ] Build completes without errors

## 🚀 Quick Deploy Steps

### 1. Database Setup (Neon)

1. Create account at https://neon.tech
2. Create new project
3. Get connection strings:
   - **Pooled** (for app): `postgresql://...@ep-xxx-pooler.region.neon.tech/...?pgbouncer=true`
   - **Direct** (for migrations): `postgresql://...@ep-xxx.region.neon.tech/...`

### 2. Environment Variables

Set in Vercel Dashboard → Settings → Environment Variables:

```env
DATABASE_URL=[pooled connection string]
DIRECT_URL=[direct connection string]
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
APP_PASSWORD=your-secure-password
```

### 3. Initial Migration

```bash
# Clone and setup
git clone [your-repo]
cd gogentic-portal-real
npm install

# Set env vars locally
cp .env.example .env
# Edit .env with your connection strings

# Generate migration
npx prisma migrate diff --from-empty --to-schema-datasource ./prisma/schema.prisma --script > prisma/migrations/20250910_init/migration.sql

# Apply to database
npx prisma migrate deploy

# Seed with initial data
npm run seed
```

### 4. Deploy to Vercel

```bash
# Push to GitHub
git add .
git commit -m "Production setup complete"
git push

# Deploy
vercel --prod
```

### 5. Verify Deployment

1. Check health: `https://your-app.vercel.app/api/health`
2. Access with password: `https://your-app.vercel.app?pass=YOUR_PASSWORD`
3. Run smoke tests: `npm test`

## 🔧 Common Operations

### Rolling Back Database

```bash
# Create Neon branch from production
neon branches create --name rollback-point

# If issues occur, swap branches in Neon dashboard
```

### Viewing Logs

```bash
# Vercel CLI
vercel logs --follow

# Or in dashboard: Vercel → Functions → Logs
```

### Running Migrations

```bash
# Create new migration
npx prisma migrate dev --name your_migration_name

# Deploy to production
npx prisma migrate deploy
```

### Updating Seed Data

```bash
# Edit prisma/seed-production.ts
# Then run:
npm run seed
```

## 🚨 Troubleshooting

### "Too many connections" error
- Ensure using pooled URL for `DATABASE_URL`
- Check connection limit in connection string
- Restart Vercel deployment

### Migration issues
- Use `DIRECT_URL` for migrations
- Check Neon dashboard for connection limits
- Verify both URLs are correctly set

### Build failures
- Run `npm run prebuild` to check for placeholders
- Ensure all env vars are set
- Check Vercel build logs

## 📊 Monitoring

### Key Metrics to Watch
- API response times (p95 < 200ms)
- Database connection pool usage
- Error rate (< 1%)
- Health check uptime

### Alerts to Set
- 5xx errors > 10/minute
- Health check failures
- Database connection failures
- Function timeouts

## 🔐 Security Notes

### Current State
- Password-based access via middleware
- No user authentication
- Client share pages are public

### Next Steps
1. Implement proper auth (Clerk/NextAuth)
2. Add role-based access control
3. Enable audit logging
4. Set up rate limiting

## 📝 Maintenance Tasks

### Daily
- Check health endpoint
- Review error logs
- Monitor database connections

### Weekly
- Review performance metrics
- Check for dependency updates
- Backup database (Neon handles automatically)

### Monthly
- Review and optimize slow queries
- Update dependencies
- Security audit
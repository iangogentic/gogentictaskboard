# Setting Up Staging Environment

## Step 1: Create Staging Database on Neon

1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project called `gogentic-portal-staging`
3. Copy the connection strings:
   - Pooled connection URL
   - Direct connection URL

## Step 2: Configure Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project: `gogentic-portal-real`
3. Go to Settings → Environment Variables
4. Add staging-specific variables for "Preview" environment:

```
DATABASE_URL=[staging-pooled-url]
DIRECT_URL=[staging-direct-url]
NEXTAUTH_URL=https://gogentic-portal-real-git-feature-experimental-iangogentic.vercel.app
NODE_ENV=staging
ENABLE_EXPERIMENTAL_FEATURES=true
```

5. Keep production variables for "Production" environment only

## Step 3: Initialize Staging Database

```bash
# 1. Create .env.staging with staging database URLs
cp .env.staging.example .env.staging
# Edit .env.staging with your staging database URLs

# 2. Generate Prisma schema for staging
DATABASE_URL=[staging-url] npx prisma generate

# 3. Push schema to staging database
DATABASE_URL=[staging-url] npx prisma db push

# 4. Seed staging with test data (optional)
DATABASE_URL=[staging-url] npx prisma db seed
```

## Step 4: Verify Staging Deployment

1. Push to experimental branch:
```bash
git push origin feature/experimental
```

2. Check deployment URL:
```
https://gogentic-portal-real-git-feature-experimental-iangogentic.vercel.app
```

3. Verify it's using staging database:
   - Check `/api/probe/db` endpoint
   - Login and verify data is different from production

## Step 5: Set Up GitHub Branch Protection

1. Go to GitHub repository settings
2. Go to Branches → Add rule
3. For `main` branch:
   - ✅ Require pull request reviews
   - ✅ Dismiss stale pull request approvals
   - ✅ Require review from CODEOWNERS
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date
   - ✅ Include administrators

## Step 6: Update Team Documentation

Share with team:
- Staging URL
- How to access staging database
- PR process for production deployments
- Emergency rollback procedures

## Verification Checklist

- [ ] Staging database created and separate from production
- [ ] Vercel environment variables configured per environment
- [ ] Staging deployment working with staging database
- [ ] Branch protection enabled on main
- [ ] Team informed of new process
- [ ] Documentation updated

## Troubleshooting

### Issue: Staging still using production database
- Check Vercel environment variables
- Ensure "Preview" environment has different DATABASE_URL
- Redeploy after changing variables

### Issue: Migrations failing on staging
- Ensure DIRECT_URL is set correctly
- Check database permissions
- Try `npx prisma db push` instead of migrate

### Issue: OAuth not working on staging
- Add staging URL to Google OAuth authorized redirect URIs
- Update NEXTAUTH_URL in Vercel for preview environment
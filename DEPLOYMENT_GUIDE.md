# 🚨 CRITICAL DEPLOYMENT GUIDE - READ BEFORE ANY DEPLOYMENT 🚨

## ⚠️ CURRENT SETUP WARNING
**PRODUCTION AND EXPERIMENTAL SHARE THE SAME DATABASE!**
Any database changes on experimental branch will immediately affect production users.

---

## 📋 Table of Contents
1. [Branch Structure](#branch-structure)
2. [Deployment URLs](#deployment-urls)
3. [Database Configuration](#database-configuration)
4. [Safe Development Workflow](#safe-development-workflow)
5. [Common Mistakes to Avoid](#common-mistakes-to-avoid)
6. [Emergency Procedures](#emergency-procedures)

---

## 🌳 Branch Structure

### Main Branch (Production)
- **Branch**: `main`
- **URL**: `https://gogentic-portal-real.vercel.app`
- **Database**: Production Neon database
- **Auto-deploys**: YES - Every push to main deploys to production
- **Protection**: Should have branch protection rules

### Experimental Branch (Staging)
- **Branch**: `feature/experimental`
- **URL**: `https://gogentic-portal-real-git-feature-experimental-iangogentic.vercel.app`
- **Database**: ⚠️ SAME AS PRODUCTION (needs fixing)
- **Auto-deploys**: YES - Every push creates preview deployment
- **Protection**: None

---

## 🌐 Deployment URLs

### Production
```
https://gogentic-portal-real.vercel.app
```

### Staging/Preview
```
https://gogentic-portal-real-git-feature-experimental-iangogentic.vercel.app
```

### Local Development
```
http://localhost:3002
```

---

## 🗄️ Database Configuration

### ⚠️ CRITICAL ISSUE: Shared Database
Currently, both production and experimental branches use the **SAME DATABASE**:

```env
DATABASE_URL="postgresql://neondb_owner:...@ep-floral-cherry-adhjhwsk-pooler.c-2.us-east-1.aws.neon.tech/neondb"
```

### Why This Is Dangerous:
1. **Schema changes** on experimental break production
2. **Data deletions** on experimental affect real users
3. **Testing data** appears in production
4. **No isolation** between environments

### Recommended Fix:
1. Create separate Neon database for staging
2. Configure Vercel environment variables per environment
3. Use `.env.local` for local development

---

## 🔄 Safe Development Workflow

### Before Starting Work:
```bash
# 1. Always start from main
git checkout main
git pull origin main

# 2. Switch to experimental
git checkout feature/experimental

# 3. Merge latest main into experimental
git merge main

# 4. Push to update staging
git push origin feature/experimental
```

### During Development:

#### ✅ SAFE Operations:
- UI/UX changes
- Client-side logic
- API routes that only READ data
- Adding new pages/components
- Styling changes

#### ⚠️ DANGEROUS Operations (DO NOT DO):
- Running Prisma migrations
- Changing database schema
- Deleting users or data
- Modifying authentication logic
- Running cleanup scripts

### Before Merging to Production:
```bash
# 1. Test on staging URL
# 2. Get approval from team
# 3. Create pull request
# 4. Merge only after review
```

---

## ❌ Common Mistakes to Avoid

### 1. **Never Push Experimental Directly to Main**
```bash
# WRONG - This deploys experimental to production!
git push origin feature/experimental:main

# RIGHT - Create a pull request
git push origin feature/experimental
# Then create PR on GitHub
```

### 2. **Never Run Migrations on Experimental**
```bash
# WRONG - This affects production database!
npx prisma migrate dev

# RIGHT - Test migrations locally first
# Only run on production after thorough testing
```

### 3. **Never Delete Data on Experimental**
```bash
# WRONG - This deletes production data!
await prisma.user.deleteMany()

# RIGHT - Use feature flags or test locally
```

### 4. **Always Check Current Branch**
```bash
# Before any operation, verify branch:
git branch --show-current
```

---

## 🚑 Emergency Procedures

### If You Accidentally Push to Production:

1. **Immediate Rollback**:
```bash
# Find last good commit
git log --oneline -10

# Revert to last good state
git revert HEAD
git push origin main
```

2. **Check Production**:
- Visit https://gogentic-portal-real.vercel.app
- Test critical functions
- Check user reports

### If Database Is Corrupted:

1. **Stop All Operations**
2. **Contact Database Admin**
3. **Use Neon's point-in-time recovery**
4. **Document what happened**

### If Authentication Breaks:

1. **Check `/api/probe/whoami` endpoint**
2. **Review recent auth-related commits**
3. **Rollback if necessary**
4. **Clear browser cookies/cache**

---

## 📊 Environment Variables

### Required for Each Environment:

#### Production (Vercel)
```env
DATABASE_URL=[production-database-url]
DIRECT_URL=[production-direct-url]
AUTH_SECRET=[production-secret]
NEXTAUTH_URL=https://gogentic-portal-real.vercel.app
```

#### Staging (Should be different!)
```env
DATABASE_URL=[staging-database-url]  # ⚠️ Currently same as prod!
DIRECT_URL=[staging-direct-url]      # ⚠️ Currently same as prod!
AUTH_SECRET=[staging-secret]
NEXTAUTH_URL=https://gogentic-portal-real-git-feature-experimental-iangogentic.vercel.app
```

#### Local Development
```env
DATABASE_URL=[local-or-dev-database]
AUTH_SECRET=[local-secret]
NEXTAUTH_URL=http://localhost:3002
```

---

## 🔒 Recommended Security Improvements

1. **Enable Branch Protection on GitHub**:
   - Require pull request reviews
   - Require status checks to pass
   - Restrict who can push to main

2. **Separate Staging Database**:
   - Create new Neon database for staging
   - Update Vercel environment variables

3. **Add Pre-deployment Checks**:
   - Run tests before deployment
   - Check for console.logs
   - Validate environment variables

4. **Implement Feature Flags**:
   - Use flags for experimental features
   - Control feature visibility per environment

---

## 📝 Quick Reference Commands

```bash
# Check current branch
git branch --show-current

# Switch branches
git checkout main
git checkout feature/experimental

# Update branch with latest main
git checkout feature/experimental
git merge main

# View deployment URLs
echo "Production: https://gogentic-portal-real.vercel.app"
echo "Staging: https://gogentic-portal-real-git-feature-experimental-iangogentic.vercel.app"

# Check which database you're using
grep DATABASE_URL .env

# Safe way to test database changes
# 1. Create local backup
# 2. Test locally
# 3. Review with team
# 4. Apply to staging (when separated)
# 5. Apply to production
```

---

## 🎯 Action Items

### Immediate (Do Now):
1. [ ] Read this entire document
2. [ ] Bookmark staging and production URLs
3. [ ] Verify you're on correct branch before working

### Short-term (This Week):
1. [ ] Set up separate staging database
2. [ ] Configure Vercel environment variables
3. [ ] Add branch protection rules on GitHub

### Long-term (This Month):
1. [ ] Implement feature flags system
2. [ ] Add automated testing
3. [ ] Create deployment checklist

---

**Last Updated**: January 2025
**Author**: Development Team
**Critical**: This document contains essential information to prevent production incidents
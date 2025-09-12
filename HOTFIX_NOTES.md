# HOTFIX: Production Auth Restoration

## Goal
Restore production authentication to a stable, OAuth-only state with proper session management and no demo bypasses.

## Root Cause Analysis
- Demo user bypass via `currentUser` cookie was causing auto-login
- Credentials provider with bcrypt/Prisma imports caused Edge Function size limit (>1MB)
- JWT token corruption from improper signIn callback implementation
- OAuth accounts potentially linked to wrong users

## Hotfix Plan

### 1. Environment Setup ✅
- [x] Create hotfix branch `hotfix/auth-prod-restore`
- [x] Verify local build compiles
- [ ] Confirm Vercel Production Branch = main
- [ ] Confirm Auto-assign Previews = on

### 2. Auth Configuration
- [ ] Remove Credentials provider from production (OAuth-only)
- [ ] Add ENABLE_CREDENTIALS_AUTH env flag for staging/dev
- [ ] Remove all `currentUser` cookie references
- [ ] Update login page to show only OAuth in production

### 3. Middleware Optimization
- [ ] Remove Node.js dependencies from middleware
- [ ] Implement minimal session check without heavy imports
- [ ] Verify Edge Function bundle < 900KB

### 4. Database Cleanup
- [ ] Audit for duplicate OAuth accounts
- [ ] Clear stale sessions
- [ ] Verify user-account linkage integrity

### 5. Testing & Validation
- [ ] Add Playwright smoke tests for auth flow
- [ ] Test OAuth login/logout cycle
- [ ] Verify protected route redirects
- [ ] Confirm no demo bypass exists

### 6. Deployment
- [ ] Deploy to production via main branch
- [ ] Verify all OAuth providers working
- [ ] Monitor for auth issues

## Vercel Configuration Checklist

- **Production Branch:** main
- **Preview Deployments:** Enabled for all branches except main
- **Environment Variables:**
  - NEXTAUTH_URL (https://gogentic-portal-real.vercel.app)
  - AUTH_SECRET (32+ random bytes)
  - AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET
  - AUTH_GITHUB_ID / AUTH_GITHUB_SECRET
  - DATABASE_URL / DIRECT_URL (Neon)
  - ENABLE_CREDENTIALS_AUTH=false (production)

## Success Criteria
1. Users can only login via OAuth (Google/GitHub)
2. No auto-login or demo user bypass
3. Proper session management (login/logout works)
4. Edge Function size < 1MB
5. All protected routes properly secured
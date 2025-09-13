# GitHub Branch Protection Rules

## How to Enable Branch Protection

1. Go to: https://github.com/iangogentic/gogentictaskboard/settings/branches
2. Click "Add rule" next to "Branch protection rules"

## Main Branch Protection

**Branch name pattern:** `main`

### Settings to Enable:

#### ✅ Protect matching branches

- [x] **Require a pull request before merging**
  - [x] Require approvals: 1
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [x] Require review from CODEOWNERS

- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - Required status checks:
    - `lint-and-type-check`
    - `test`
    - `build`

- [x] **Require conversation resolution before merging**

- [x] **Require signed commits** (optional but recommended)

- [x] **Include administrators** (enforce for everyone)

- [x] **Restrict who can push to matching branches**
  - Add users: iangogentic (you)

#### ❌ Do NOT enable:

- [ ] Allow force pushes
- [ ] Allow deletions

## Staging Branch Protection

**Branch name pattern:** `staging`

### Settings to Enable:

- [x] **Require a pull request before merging**
  - [ ] Require approvals: 0 (no approval needed for staging)

- [x] **Require status checks to pass before merging**
  - Required status checks:
    - `lint-and-type-check`
    - `build`

- [ ] Include administrators (allow admins to push directly for hotfixes)

## Additional Security Settings

### Deploy Keys (if needed)

1. Go to Settings → Deploy keys
2. Add read-only keys for CI/CD services

### Webhook Security

1. Go to Settings → Webhooks
2. Ensure all webhooks use secrets
3. Use HTTPS URLs only

### Secrets Management

1. Go to Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `VERCEL_TOKEN` - Get from https://vercel.com/account/tokens
   - `VERCEL_ORG_ID` - team_lV9UhkXVQAG9skK6C17UWfbo
   - `VERCEL_PROJECT_ID` - prj_nSQ3rhqChEpoP9nNLmpKlGepGhd9
   - `DATABASE_URL` - Production database URL
   - `NEXTAUTH_SECRET` - Production auth secret
   - `NEXTAUTH_URL` - https://gogentic-portal-real.vercel.app
   - `SNYK_TOKEN` - (Optional) For security scanning

## Enforcement Timeline

1. **Immediate**: Enable basic protection (no force push, no deletion)
2. **After CI/CD testing**: Enable status checks
3. **After team training**: Enable PR requirements

## Emergency Override

If you need to bypass protection in an emergency:

1. Temporarily disable "Include administrators"
2. Make the critical fix
3. Re-enable protection immediately after

⚠️ **IMPORTANT**: Document any protection bypass in the commit message

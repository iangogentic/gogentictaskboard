# Production Environment Variables Checklist

## Required OAuth Variables

### 1. NEXTAUTH_URL
- **Production**: `https://gogentic-portal-real.vercel.app`
- **Preview**: Use preview URL (auto-set by Vercel)
- **Local**: `http://localhost:3000`
- **Important**: No trailing slash, must be exact domain

### 2. AUTH_SECRET
- **Production**: 32+ random bytes (generate with `openssl rand -base64 32`)
- **Never share or commit this value**
- **Must be consistent across all instances**

### 3. OAuth Provider Credentials

#### Google OAuth
- **AUTH_GOOGLE_ID**: OAuth 2.0 Client ID from Google Cloud Console
- **AUTH_GOOGLE_SECRET**: OAuth 2.0 Client Secret
- **Authorized redirect URIs**: 
  - `https://gogentic-portal-real.vercel.app/api/auth/callback/google`
  - Add preview URLs as needed

#### GitHub OAuth (if enabled)
- **AUTH_GITHUB_ID**: OAuth App Client ID from GitHub Settings
- **AUTH_GITHUB_SECRET**: OAuth App Client Secret
- **Authorization callback URL**:
  - `https://gogentic-portal-real.vercel.app/api/auth/callback/github`

### 4. Database Configuration
- **DATABASE_URL**: Neon PostgreSQL connection string (pooled)
- **DIRECT_URL**: Neon direct connection (for migrations only)

### 5. Feature Flags
- **NEXT_PUBLIC_ENABLE_CREDENTIALS_AUTH**: 
  - Production: `false` (OAuth only)
  - Staging: `true` (if credentials needed)
  - Dev: `true`

## Verification Steps

### Via Vercel CLI
```bash
# List all production environment variables
vercel env ls production

# Pull env vars to local .env.production.local
vercel env pull .env.production.local
```

### Via Vercel Dashboard
1. Go to Project Settings → Environment Variables
2. Filter by "Production" environment
3. Verify each variable exists and is encrypted
4. Check "Preview" and "Development" have appropriate values

### Runtime Validation
Add this to `app/api/health/route.ts`:
```typescript
export async function GET() {
  const missing = []
  
  if (!process.env.NEXTAUTH_URL) missing.push('NEXTAUTH_URL')
  if (!process.env.AUTH_SECRET) missing.push('AUTH_SECRET')
  if (!process.env.AUTH_GOOGLE_ID) missing.push('AUTH_GOOGLE_ID')
  if (!process.env.AUTH_GOOGLE_SECRET) missing.push('AUTH_GOOGLE_SECRET')
  if (!process.env.DATABASE_URL) missing.push('DATABASE_URL')
  
  if (missing.length > 0) {
    console.warn('Missing required environment variables:', missing)
    return Response.json({ 
      status: 'unhealthy',
      missing: process.env.NODE_ENV === 'development' ? missing : missing.length 
    }, { status: 500 })
  }
  
  return Response.json({ status: 'healthy' })
}
```

## Example .env.production.local
```env
# DO NOT COMMIT THIS FILE
# Auth Configuration
NEXTAUTH_URL=https://gogentic-portal-real.vercel.app
AUTH_SECRET=your-32-byte-secret-here

# Google OAuth
AUTH_GOOGLE_ID=your-google-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your-google-client-secret

# GitHub OAuth (optional)
AUTH_GITHUB_ID=your-github-client-id
AUTH_GITHUB_SECRET=your-github-client-secret

# Database
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
DIRECT_URL=postgresql://user:pass@host/db?sslmode=require

# Feature Flags
NEXT_PUBLIC_ENABLE_CREDENTIALS_AUTH=false

# App Configuration
NEXT_PUBLIC_APP_URL=https://gogentic-portal-real.vercel.app
```

## Common Issues

### "Client ID is undefined"
- AUTH_GOOGLE_ID or AUTH_GITHUB_ID is missing or malformed
- Check for extra spaces or quotes in the value

### "Invalid redirect_uri"
- NEXTAUTH_URL doesn't match OAuth provider configuration
- Add all deployment URLs to OAuth provider's authorized redirects

### "NEXTAUTH_SECRET is not set"
- AUTH_SECRET is missing (note: variable name changed in NextAuth v5)
- Generate new secret and update across all environments

### Session not persisting
- AUTH_SECRET mismatch between deployments
- Cookie domain issues (check NEXTAUTH_URL)
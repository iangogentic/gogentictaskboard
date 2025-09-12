# Middleware Constraints & Size Management

## Edge Function Size Limit
- **Hard limit**: 1 MB (1,048,576 bytes)
- **Safe target**: < 900 KB to leave headroom
- **Current approach**: OAuth-only config for Edge runtime

## Forbidden Imports in Middleware

These packages CANNOT be used in middleware.ts as they require Node.js runtime:

- ❌ `@prisma/client` or any Prisma imports
- ❌ `bcrypt` / `bcryptjs` 
- ❌ `argon2`
- ❌ Node.js built-ins (fs, path, crypto)
- ❌ Database drivers (pg, mysql2, mongodb)
- ❌ Heavy authentication libraries

## Allowed in Middleware

- ✅ `next-auth` core functions (withAuth)
- ✅ JWT verification (jose library)
- ✅ Cookie parsing
- ✅ URL manipulation
- ✅ Basic string/array operations

## Current Middleware Strategy

```typescript
// middleware.ts - EDGE SAFE VERSION
import NextAuth from "next-auth"
import authConfig from "@/auth.config" // OAuth-only config

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  // Minimal auth check logic
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  
  // Public routes that don't require auth
  const isPublicRoute = 
    nextUrl.pathname.startsWith('/api/auth') ||
    nextUrl.pathname.startsWith('/login') ||
    nextUrl.pathname.startsWith('/register')
  
  // Redirect logic
  if (!isLoggedIn && !isPublicRoute) {
    return Response.redirect(new URL('/login', nextUrl))
  }
  
  return null
})
```

## Size Monitoring Script

Add to `package.json`:
```json
{
  "scripts": {
    "check:middleware": "node scripts/check-middleware-size.js"
  }
}
```

Create `scripts/check-middleware-size.js`:
```javascript
const fs = require('fs')
const path = require('path')

// TODO: Implement proper Edge Function size estimation
// For now, use a simple heuristic based on imports

const middlewarePath = path.join(process.cwd(), 'middleware.ts')
const content = fs.readFileSync(middlewarePath, 'utf-8')

const dangerousImports = [
  '@prisma/client',
  'prisma',
  'bcrypt',
  'argon2',
  'mysql',
  'postgres',
  'mongodb'
]

const violations = dangerousImports.filter(imp => 
  content.includes(`from '${imp}'`) || 
  content.includes(`from "${imp}"`)
)

if (violations.length > 0) {
  console.error('❌ Middleware contains Node.js-only imports:', violations)
  console.error('These will cause Edge Function size limit errors!')
  process.exit(1)
}

console.log('✅ Middleware appears Edge-safe')

// Rough size estimate (very approximate)
const estimatedSize = content.length * 50 // Assume 50x bloat from bundling
console.log(`Estimated size: ${(estimatedSize / 1024).toFixed(2)} KB`)

if (estimatedSize > 900 * 1024) {
  console.warn('⚠️  Middleware may be approaching size limit')
}
```

## CI Integration

Add to `.github/workflows/ci.yml`:
```yaml
- name: Check Middleware Size
  run: npm run check:middleware
```

## Alternative Patterns for Complex Auth

If you need Credentials provider or complex auth logic:

### Pattern 1: Dual Config Files
```
auth.config.edge.ts   # OAuth only, for middleware
auth.config.node.ts   # Full config with Credentials
```

### Pattern 2: API Route Auth Check
Instead of middleware auth, use API routes:
```typescript
// app/api/auth/check/route.ts
import { auth } from '@/auth' // Full auth with Prisma

export async function GET() {
  const session = await auth()
  return Response.json({ authenticated: !!session })
}
```

### Pattern 3: Lazy Load Heavy Deps
```typescript
// Only load Prisma when actually needed
async function getPrisma() {
  const { default: prisma } = await import('@/lib/prisma')
  return prisma
}
```

## Debugging Size Issues

1. Build locally and check `.next/server/middleware.js`
2. Use `npx @next/bundle-analyzer` to visualize bundle
3. Check Vercel deployment logs for exact size
4. Remove imports one by one to identify culprit

## Emergency Fixes

If middleware exceeds limit in production:

1. **Quick fix**: Remove middleware.ts entirely, rely on page-level auth
2. **Medium fix**: Strip down to minimal cookie check
3. **Proper fix**: Separate Edge and Node auth configs

## References
- [Vercel Edge Function Limits](https://vercel.com/docs/functions/edge-functions#limitations)
- [NextAuth Edge Compatibility](https://next-auth.js.org/configuration/nextjs#middleware)
- Issue tracker: #edge-function-size
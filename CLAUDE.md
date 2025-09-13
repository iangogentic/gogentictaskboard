# Claude Code Assistant Guide - Gogentic Portal

## 🎯 Project Overview
This is the Gogentic Portal - an internal project management system with authentication, task tracking, and team collaboration features.

## ⚠️ CRITICAL WARNINGS

### 1. Database is Shared Between Environments
**NEVER run these commands on experimental branch:**
- `prisma migrate dev` - Will affect production!
- `prisma db push` - Will affect production!
- Any data deletion scripts - Will delete production data!

### 2. Authentication is Live
- Real user accounts exist in the database
- OAuth is connected to production Google accounts
- Changes affect real user sessions

## 📁 Project Structure

```
gogentic-portal-real/
├── app/                    # Next.js 15 app directory
│   ├── api/               # API routes
│   ├── (auth)/           # Auth pages (login/register)
│   ├── dashboard/        # Dashboard pages
│   ├── my-work/         # User's personal work view
│   └── projects/        # Project management
├── components/           # React components
├── lib/                 # Utility functions
├── prisma/              # Database schema
├── docs/               # Documentation
└── scripts/           # Utility scripts
```

## 🔧 Common Tasks

### Starting Development
```bash
# Check you're on correct branch
git branch --show-current

# Start dev server (uses port 3002)
npm run dev

# Open Prisma Studio
npx prisma studio
```

### Working with Authentication
- Primary account: `ian@gogentic.ai`
- Test endpoint: `/api/probe/whoami`
- Auth uses NextAuth v5 with PrismaAdapter

### Database Commands (USE WITH CAUTION)
```bash
# Generate Prisma client (safe)
npx prisma generate

# DO NOT RUN on experimental branch:
# npx prisma migrate dev
# npx prisma db push
```

## 🌳 Git Workflow

### Safe Branch Management
```bash
# Always pull latest main first
git checkout main
git pull origin main

# Switch to experimental
git checkout feature/experimental

# Merge main into experimental (get latest fixes)
git merge main

# Work on experimental
# ... make changes ...

# Push to experimental (creates staging deployment)
git push origin feature/experimental

# NEVER push experimental directly to main
# Always create a pull request
```

## 🐛 Known Issues & Solutions

### Issue: "Still logs in as Aakansha"
**Cause**: Cookie-based user selection or fallback
**Solution**: 
1. Check for `cookieStore.get('currentUser')`
2. Ensure using `auth()` from NextAuth
3. Clear browser cookies

### Issue: Database connection timeout
**Cause**: Connection pool exhausted
**Solution**: 
1. Check for missing `await` on Prisma calls
2. Ensure proper connection cleanup
3. May need to restart dev server

### Issue: Merge conflicts with main
**Common conflicts**:
- `middleware.ts` - Auth route handling
- `app/api/navigation-data/route.ts` - User selection
- `components/projects-table.tsx` - UI components

## 📊 Environment Variables

### Required Variables
```env
DATABASE_URL        # Pooled connection
DIRECT_URL         # Direct connection for migrations
AUTH_SECRET        # NextAuth secret
NEXTAUTH_URL       # App URL
AUTH_GOOGLE_ID     # Google OAuth
AUTH_GOOGLE_SECRET # Google OAuth secret
```

### Per-Environment Settings
- Production: Set in Vercel dashboard
- Staging: Should have separate database (currently doesn't!)
- Local: Use `.env.local`

## 🚀 Deployment

### Production Deployment
- Branch: `main`
- URL: `https://gogentic-portal-real.vercel.app`
- Auto-deploys on push to main

### Staging Deployment
- Branch: `feature/experimental`
- URL: `https://gogentic-portal-real-git-feature-experimental-iangogentic.vercel.app`
- Auto-deploys on push to branch
- ⚠️ Uses same database as production!

## 🔍 Debugging Tools

### Probe Endpoints
- `/api/probe/whoami` - Check auth status
- `/api/probe/db` - Check database connection
- `/api/admin/*` - Admin tools (protected)

### Useful Commands
```bash
# Check current user in database
npx prisma studio
# Navigate to User table

# View Vercel deployment logs
vercel logs

# Check git history
git log --oneline -10

# Find text in codebase
grep -r "cookieStore" --include="*.ts" --include="*.tsx"
```

## 📝 Code Style Guidelines

### Authentication Pattern
```typescript
// Always use this pattern for auth
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const session = await auth()
if (!session?.user?.email) {
  // Handle unauthenticated
}

const user = await prisma.user.findUnique({
  where: { email: session.user.email }
})
```

### API Route Pattern
```typescript
export const runtime = 'nodejs' // Required for Prisma

export async function GET() {
  try {
    const session = await auth()
    // ... rest of logic
  } catch (error) {
    return NextResponse.json(
      { error: 'Error message' },
      { status: 500 }
    )
  }
}
```

## 🛑 Do NOT Do These

1. **Never hardcode user emails** as fallbacks
2. **Never use cookies** for user selection
3. **Never push experimental to main** without PR
4. **Never run migrations** on experimental branch
5. **Never delete users** without checking environment
6. **Never commit** `.env` files
7. **Never skip** authentication checks

## 💡 Tips for Claude

When working on this project:
1. Always check current branch first
2. Verify database impact before running commands
3. Test auth changes with probe endpoints
4. Create backups before major changes
5. Document any new patterns or fixes
6. Update this file with new learnings

## 📚 Additional Resources

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Critical deployment information
- [docs/](./docs/) - Additional documentation
- [Vercel Dashboard](https://vercel.com) - Deployment management
- [Neon Dashboard](https://console.neon.tech) - Database management

---

**Remember**: When in doubt, ask before making changes that could affect production!
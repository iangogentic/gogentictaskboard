# Database Auth Audit & Remediation Guide

## Read-Only Audit Queries

Run these queries to identify auth issues without modifying data:

### 1. Find Duplicate Provider Account IDs
```sql
-- Check if any Google/GitHub account is linked to multiple users
SELECT 
  provider, 
  "providerAccountId", 
  COUNT(*) as duplicate_count,
  ARRAY_AGG("userId") as user_ids,
  ARRAY_AGG("id") as account_ids
FROM "Account"
WHERE provider IN ('google', 'github')
GROUP BY provider, "providerAccountId"
HAVING COUNT(*) > 1;
```

### 2. Users with Multiple OAuth Accounts (Same Provider)
```sql
-- Find users with multiple Google or GitHub accounts
SELECT 
  "userId",
  provider,
  COUNT(*) as account_count,
  ARRAY_AGG("providerAccountId") as provider_ids
FROM "Account" 
WHERE provider IN ('google', 'github')
GROUP BY "userId", provider
HAVING COUNT(*) > 1;
```

### 3. Orphaned Sessions (Users Deleted)
```sql
-- Find sessions pointing to non-existent users
SELECT 
  s.id as session_id,
  s."userId" as missing_user_id,
  s."sessionToken",
  s.expires
FROM "Session" s 
LEFT JOIN "User" u ON s."userId" = u.id 
WHERE u.id IS NULL;
```

### 4. Stale Sessions (Expired)
```sql
-- Find expired sessions that should be cleaned up
SELECT 
  s.id,
  s."userId",
  u.email,
  s.expires,
  NOW() - s.expires as expired_ago
FROM "Session" s
JOIN "User" u ON s."userId" = u.id
WHERE s.expires < NOW()
ORDER BY s.expires DESC;
```

### 5. Account-User Integrity Check
```sql
-- Verify all accounts have valid users
SELECT 
  a.id as account_id,
  a.provider,
  a."providerAccountId",
  a."userId",
  u.email,
  u.name
FROM "Account" a
LEFT JOIN "User" u ON a."userId" = u.id
WHERE u.id IS NULL OR u.email IS NULL;
```

## Safe Remediation Procedures

### Step 1: Backup Current State
```sql
-- Export affected records before making changes
-- Run these SELECT statements and save results

-- Backup accounts table
SELECT * FROM "Account" 
WHERE provider IN ('google', 'github')
ORDER BY "userId", provider;

-- Backup sessions
SELECT * FROM "Session"
ORDER BY expires DESC;

-- Backup users
SELECT id, email, name, role, "createdAt" 
FROM "User"
ORDER BY "createdAt" DESC;
```

### Step 2: Remediation Templates

#### Remove Duplicate OAuth Accounts
```sql
-- Template: Remove incorrect account linking
-- FILL IN: wrong_user_id, provider_account_id

-- First verify what will be deleted
SELECT * FROM "Account" 
WHERE "userId" = 'FILL_wrong_user_id' 
  AND "providerAccountId" = 'FILL_provider_account_id';

-- Then delete if confirmed
-- DELETE FROM "Account" 
-- WHERE "userId" = 'FILL_wrong_user_id' 
--   AND "providerAccountId" = 'FILL_provider_account_id';
```

#### Clear Invalid Sessions
```sql
-- Remove orphaned sessions (no user)
-- First verify
SELECT * FROM "Session" s
LEFT JOIN "User" u ON s."userId" = u.id
WHERE u.id IS NULL;

-- Then delete if confirmed
-- DELETE FROM "Session"
-- WHERE "userId" NOT IN (SELECT id FROM "User");

-- Remove expired sessions
-- First verify
SELECT * FROM "Session" WHERE expires < NOW();

-- Then delete if confirmed  
-- DELETE FROM "Session" WHERE expires < NOW();
```

#### Clear All Sessions (Nuclear Option)
```sql
-- Force all users to re-authenticate
-- WARNING: This will log out ALL users

-- First count affected sessions
SELECT COUNT(*) FROM "Session";

-- Clear all if necessary
-- TRUNCATE TABLE "Session";
```

### Step 3: Post-Remediation Validation

Run all audit queries again to verify:
1. No duplicate providerAccountIds remain
2. No orphaned sessions exist
3. All accounts link to valid users
4. Session count is reasonable

### Step 4: Monitor After Fix

Create a monitoring query to run periodically:
```sql
-- Health check query
SELECT 
  'Duplicate OAuth Accounts' as check_name,
  COUNT(*) as issue_count
FROM (
  SELECT "providerAccountId"
  FROM "Account"
  WHERE provider IN ('google', 'github')
  GROUP BY provider, "providerAccountId"
  HAVING COUNT(*) > 1
) duplicates

UNION ALL

SELECT 
  'Orphaned Sessions' as check_name,
  COUNT(*) as issue_count
FROM "Session" s
LEFT JOIN "User" u ON s."userId" = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
  'Expired Sessions' as check_name,
  COUNT(*) as issue_count
FROM "Session"
WHERE expires < NOW();
```

## Script for Automated Cleanup

Save as `scripts/auth-cleanup.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupAuth(dryRun = true) {
  console.log(`Running auth cleanup (dry run: ${dryRun})`)
  
  // Find duplicates
  const duplicates = await prisma.$queryRaw`
    SELECT provider, "providerAccountId", COUNT(*) c, ARRAY_AGG("userId") users
    FROM "Account"
    WHERE provider IN ('google','github')
    GROUP BY provider, "providerAccountId"
    HAVING COUNT(*) > 1
  `
  
  if (duplicates.length > 0) {
    console.log('Found duplicate accounts:', duplicates)
    // Add remediation logic here
  }
  
  // Clean expired sessions
  const expired = await prisma.session.findMany({
    where: { expires: { lt: new Date() } }
  })
  
  console.log(`Found ${expired.length} expired sessions`)
  
  if (!dryRun && expired.length > 0) {
    const result = await prisma.session.deleteMany({
      where: { expires: { lt: new Date() } }
    })
    console.log(`Deleted ${result.count} expired sessions`)
  }
  
  await prisma.$disconnect()
}

// Run with: npx tsx scripts/auth-cleanup.ts
cleanupAuth(process.argv.includes('--execute') ? false : true)
```

## Emergency Contacts

If auth is completely broken:
1. Set NEXTAUTH_URL to exact production URL
2. Regenerate AUTH_SECRET and update everywhere
3. Clear all sessions: `TRUNCATE TABLE "Session"`
4. Have users re-authenticate
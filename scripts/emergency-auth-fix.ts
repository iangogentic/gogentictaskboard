import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function emergencyFix() {
  console.log('🚨 EMERGENCY AUTH FIX\n')
  
  // 1. Clear ALL sessions
  console.log('1. Clearing all sessions...')
  const deletedSessions = await prisma.session.deleteMany()
  console.log(`   ✅ Deleted ${deletedSessions.count} sessions\n`)
  
  // 2. Check for Aakansha's OAuth accounts
  console.log('2. Checking Aakansha OAuth accounts...')
  const aakanshaAccounts = await prisma.account.findMany({
    where: {
      user: {
        email: {
          contains: 'aakansha',
          mode: 'insensitive'
        }
      }
    },
    include: {
      user: true
    }
  })
  
  console.log(`   Found ${aakanshaAccounts.length} OAuth accounts for Aakansha:`)
  aakanshaAccounts.forEach(acc => {
    console.log(`   - ${acc.provider}: ${acc.providerAccountId}`)
    console.log(`     User: ${acc.user.email} (ID: ${acc.userId})`)
  })
  
  // 3. Check YOUR OAuth account
  console.log('\n3. Checking Ian\'s OAuth accounts...')
  const ianAccounts = await prisma.account.findMany({
    where: {
      OR: [
        { providerAccountId: '116862172084809229947' }, // Your Google ID
        { user: { email: { contains: 'ianigreenberg' } } }
      ]
    },
    include: {
      user: true
    }
  })
  
  console.log(`   Found ${ianAccounts.length} OAuth accounts for Ian:`)
  ianAccounts.forEach(acc => {
    console.log(`   - ${acc.provider}: ${acc.providerAccountId}`)
    console.log(`     User: ${acc.user.email} (ID: ${acc.userId})`)
  })
  
  // 4. Check for any suspicious first user selection
  console.log('\n4. Checking first user in database...')
  const firstUser = await prisma.user.findFirst({
    orderBy: { createdAt: 'asc' }
  })
  console.log(`   First user: ${firstUser?.email} (ID: ${firstUser?.id})`)
  
  // 5. Check for users with same OAuth provider ID (should be none)
  console.log('\n5. Checking for duplicate OAuth provider IDs...')
  const duplicates = await prisma.$queryRaw`
    SELECT provider, "providerAccountId", COUNT(*) as count,
           ARRAY_AGG("userId") as user_ids
    FROM "Account"
    WHERE provider = 'google'
    GROUP BY provider, "providerAccountId"
    HAVING COUNT(*) > 1
  ` as any[]
  
  if (duplicates.length > 0) {
    console.log('   ⚠️  FOUND DUPLICATES:')
    duplicates.forEach(dup => {
      console.log(`   Provider ID ${dup.providerAccountId} linked to ${dup.count} users:`)
      console.log(`   User IDs: ${dup.user_ids.join(', ')}`)
    })
  } else {
    console.log('   ✅ No duplicate OAuth accounts found')
  }
  
  // 6. Recommendations
  console.log('\n📋 RECOMMENDATIONS:')
  console.log('1. All sessions have been cleared')
  console.log('2. Try logging in again with your Google account')
  console.log('3. Check /api/auth/_debug after login')
  console.log('4. If still showing Aakansha, check Vercel logs for AUTH_DEBUG output')
  
  await prisma.$disconnect()
}

emergencyFix().catch(console.error)
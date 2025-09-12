import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testOAuthMatch() {
  console.log('Testing OAuth Account Matching\n')
  
  // Your Google Provider Account ID
  const yourGoogleId = '116862172084809229947'
  
  console.log(`Looking for Google account: ${yourGoogleId}`)
  
  // Find the account
  const account = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: 'google',
        providerAccountId: yourGoogleId
      }
    },
    include: {
      user: true
    }
  })
  
  if (account) {
    console.log('\n✅ Found OAuth account:')
    console.log(`   Provider: ${account.provider}`)
    console.log(`   Provider Account ID: ${account.providerAccountId}`)
    console.log(`   Linked User ID: ${account.userId}`)
    console.log(`   User Email: ${account.user.email}`)
    console.log(`   User Name: ${account.user.name}`)
  } else {
    console.log('\n❌ OAuth account not found!')
  }
  
  // Check if there's any cross-contamination
  console.log('\n\nChecking for any email conflicts...')
  const emailConflicts = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: 'ian', mode: 'insensitive' } },
        { email: { contains: 'aakansha', mode: 'insensitive' } }
      ]
    },
    include: {
      accounts: true
    }
  })
  
  console.log(`Found ${emailConflicts.length} users with ian/aakansha in email:`)
  emailConflicts.forEach(user => {
    console.log(`\n   ${user.email} (ID: ${user.id})`)
    if (user.accounts.length > 0) {
      user.accounts.forEach(acc => {
        console.log(`      OAuth: ${acc.provider} - ${acc.providerAccountId}`)
      })
    } else {
      console.log(`      No OAuth accounts`)
    }
  })
  
  await prisma.$disconnect()
}

testOAuthMatch().catch(console.error)
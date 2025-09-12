import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixOAuth() {
  try {
    // First, show all OAuth accounts
    const accounts = await prisma.account.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })

    console.log('Current OAuth accounts:')
    accounts.forEach(account => {
      console.log(`- ${account.user.name} (${account.user.email}): ${account.provider} - ${account.providerAccountId}`)
    })

    // Check for duplicate Google accounts or wrong associations
    const googleAccounts = accounts.filter(a => a.provider === 'google')
    const accountsByProviderId = new Map<string, typeof accounts[0][]>()
    
    googleAccounts.forEach(account => {
      const existing = accountsByProviderId.get(account.providerAccountId) || []
      existing.push(account)
      accountsByProviderId.set(account.providerAccountId, existing)
    })

    // Find any duplicate provider account IDs
    console.log('\nChecking for duplicate provider accounts:')
    let hasDuplicates = false
    accountsByProviderId.forEach((accounts, providerId) => {
      if (accounts.length > 1) {
        hasDuplicates = true
        console.log(`⚠️  Provider ID ${providerId} is linked to multiple users:`)
        accounts.forEach(a => {
          console.log(`   - ${a.user.name} (${a.user.email})`)
        })
      }
    })

    if (!hasDuplicates) {
      console.log('✅ No duplicate provider accounts found')
    }

    // Check sessions
    const sessions = await prisma.session.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })

    console.log('\nActive sessions:')
    sessions.forEach(session => {
      console.log(`- ${session.user.name} (${session.user.email}): expires ${session.expires}`)
    })

    // Option to clear all sessions (uncomment to use)
    // console.log('\nClearing all sessions...')
    // await prisma.session.deleteMany()
    // console.log('✅ All sessions cleared')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixOAuth()
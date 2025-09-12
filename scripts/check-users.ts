import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        accounts: {
          select: {
            provider: true,
            providerAccountId: true
          }
        }
      }
    })

    console.log('All users in database:')
    users.forEach(user => {
      console.log(`\nUser: ${user.name} (${user.email})`)
      console.log(`  ID: ${user.id}`)
      if (user.accounts.length > 0) {
        console.log('  OAuth accounts:')
        user.accounts.forEach(account => {
          console.log(`    - ${account.provider}: ${account.providerAccountId}`)
        })
      } else {
        console.log('  No OAuth accounts')
      }
    })

    // Check specifically for Aakansha
    const aakansha = users.find(u => u.email === 'aakansha@gogentic.com')
    if (aakansha) {
      console.log('\n⚠️  Found Aakansha in database!')
      if (aakansha.accounts.length > 0) {
        console.log('   She has OAuth accounts linked!')
      }
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
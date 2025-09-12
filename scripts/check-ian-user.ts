import prisma from '../lib/prisma'

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'ian@gogentic.com' }
  })
  
  console.log('User with email ian@gogentic.com:', user)
  
  // Also check all users
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true },
    orderBy: { email: 'asc' }
  })
  
  console.log('\nAll users:')
  allUsers.forEach(u => console.log(`- ${u.email}: ${u.name} (${u.id})`))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
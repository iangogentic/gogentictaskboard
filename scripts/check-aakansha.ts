import prisma from '../lib/prisma'

async function main() {
  // Check both Aakanshas
  const aakansha1 = await prisma.user.findUnique({
    where: { email: 'aakansha@gogentic.ai' }
  })
  
  const aakansha2 = await prisma.user.findUnique({
    where: { email: 'aakansha@gogentic.com' }
  })
  
  console.log('aakansha@gogentic.ai:', aakansha1)
  console.log('\naakansha@gogentic.com:', aakansha2)
  
  // Check first user in DB
  const firstUser = await prisma.user.findFirst({
    orderBy: { createdAt: 'asc' }
  })
  
  console.log('\nFirst user by creation date:', firstUser)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
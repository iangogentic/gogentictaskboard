import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const result = await prisma.project.deleteMany({
    where: {
      title: 'Test Automation Project'
    }
  })
  
  console.log(`Deleted ${result.count} test projects`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
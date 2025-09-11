import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedPortfolios() {
  console.log('🌱 Seeding portfolios...')

  const portfolios = [
    {
      key: 'cortex',
      name: 'Cortex',
      color: '#5B67F1',
      description: 'AI-powered innovation and machine learning solutions',
      order: 1
    },
    {
      key: 'solutions',
      name: 'Solutions',
      color: '#10B981',
      description: 'Client-focused custom development and integrations',
      order: 2
    },
    {
      key: 'launchpad',
      name: 'Launchpad',
      color: '#F59E0B',
      description: 'Rapid prototyping and MVP development',
      order: 3
    },
    {
      key: 'fisher',
      name: 'Fisher',
      color: '#EF4444',
      description: 'Enterprise-scale platforms and infrastructure',
      order: 4
    }
  ]

  for (const portfolio of portfolios) {
    await prisma.portfolio.upsert({
      where: { key: portfolio.key },
      update: portfolio,
      create: portfolio
    })
    console.log(`✅ Created/Updated portfolio: ${portfolio.name}`)
  }

  console.log('🎉 Portfolio seeding complete!')
}

seedPortfolios()
  .catch((e) => {
    console.error('Error seeding portfolios:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
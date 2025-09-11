import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function assignPortfolios() {
  console.log('🔄 Assigning projects to portfolios...')

  try {
    // Get all portfolios
    const portfolios = await prisma.portfolio.findMany()
    const cortex = portfolios.find(p => p.key === 'cortex')
    const solutions = portfolios.find(p => p.key === 'solutions')
    const launchpad = portfolios.find(p => p.key === 'launchpad')
    const fisher = portfolios.find(p => p.key === 'fisher')

    if (!cortex || !solutions || !launchpad || !fisher) {
      console.error('❌ Not all portfolios found. Please run seed-portfolios.ts first.')
      return
    }

    // Get all projects
    const projects = await prisma.project.findMany()
    console.log(`Found ${projects.length} projects to assign`)

    // Assign projects based on their current branch or title
    for (const project of projects) {
      let portfolioId = null
      let stage = 'Discovery'
      let health = 'Green'

      // Assign based on branch first, then title keywords
      if (project.branch === 'CORTEX') {
        portfolioId = cortex.id
        stage = (project.status === 'In Progress' || project.status === 'IN_PROGRESS') ? 'Build' : 'Discovery'
      } else if (project.branch === 'SOLUTIONS') {
        portfolioId = solutions.id
        stage = (project.status === 'In Progress' || project.status === 'IN_PROGRESS') ? 'Build' : 
                (project.status === 'Blocked' || project.status === 'BLOCKED') ? 'Build' : 'Discovery'
      } else if (project.branch === 'LAUNCHPAD') {
        portfolioId = launchpad.id
        stage = 'Discovery'
      } else if (project.branch === 'FISHER') {
        portfolioId = fisher.id
        stage = 'Discovery'
      } else if (project.title.toLowerCase().includes('ai') || 
                 project.title.toLowerCase().includes('course') || 
                 project.title.toLowerCase().includes('agent')) {
        portfolioId = cortex.id
        stage = (project.status === 'In Progress' || project.status === 'IN_PROGRESS') ? 'Build' : 'Discovery'
      } else if (project.title.toLowerCase().includes('canvas') || 
                 project.title.toLowerCase().includes('email') || 
                 project.title.toLowerCase().includes('automation') ||
                 project.title.toLowerCase().includes('dashboard') || 
                 project.title.toLowerCase().includes('optimization') ||
                 project.title.toLowerCase().includes('badge')) {
        portfolioId = solutions.id
        stage = (project.status === 'In Progress' || project.status === 'IN_PROGRESS') ? 'Build' : 
                (project.status === 'Blocked' || project.status === 'BLOCKED') ? 'Build' : 'Discovery'
      } else if (project.title.toLowerCase().includes('mvp') || 
                 project.title.toLowerCase().includes('prototype')) {
        portfolioId = launchpad.id
        stage = 'Discovery'
      } else if (project.title.toLowerCase().includes('enterprise') || 
                 project.title.toLowerCase().includes('platform')) {
        portfolioId = fisher.id
        stage = 'Discovery'
      }

      // Set health based on status (use exact status values from DB)
      if (project.status === 'Blocked' || project.status === 'BLOCKED') {
        health = 'Red'
      } else if (project.status === 'In Progress' || project.status === 'IN_PROGRESS') {
        health = 'Amber'
      } else if (project.status === 'Not Started' || project.status === 'NOT_STARTED') {
        health = 'Green'
      } else if (project.status === 'PLANNING') {
        health = 'Amber'
      } else {
        health = 'Green'
      }

      // Default to Solutions if no match
      if (!portfolioId) {
        portfolioId = solutions.id
      }

      // Update the project
      await prisma.project.update({
        where: { id: project.id },
        data: {
          portfolioId,
          stage,
          health
        }
      })

      const portfolio = portfolios.find(p => p.id === portfolioId)
      console.log(`✅ Assigned "${project.title}" to ${portfolio?.name} (${stage}, ${health})`)
    }

    // Get updated stats
    console.log('\n📊 Portfolio distribution:')
    for (const portfolio of portfolios) {
      const count = await prisma.project.count({
        where: { portfolioId: portfolio.id }
      })
      console.log(`  ${portfolio.name}: ${count} projects`)
    }

    console.log('\n🎉 Portfolio assignment complete!')
  } catch (error) {
    console.error('Error assigning portfolios:', error)
  } finally {
    await prisma.$disconnect()
  }
}

assignPortfolios()
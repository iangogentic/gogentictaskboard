import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  Clearing existing data...')
  
  // Delete all existing data in order to avoid foreign key constraints
  await prisma.timeEntry.deleteMany()
  await prisma.deliverable.deleteMany()
  await prisma.update.deleteMany()
  await prisma.task.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()
  
  console.log('✅ All data cleared')
  
  console.log('🌱 Seeding new data...')
  
  // Create users
  const matthew = await prisma.user.create({
    data: {
      name: 'Matthew',
      email: 'matthew@gogentic.com',
    }
  })
  
  const mia = await prisma.user.create({
    data: {
      name: 'Mia',
      email: 'mia@gogentic.com',
    }
  })
  
  const aakansha = await prisma.user.create({
    data: {
      name: 'Aakansha',
      email: 'aakansha@gogentic.com',
    }
  })
  
  const kelly = await prisma.user.create({
    data: {
      name: 'Kelly',
      email: 'kelly@gogentic.com',
    }
  })
  
  const arjun = await prisma.user.create({
    data: {
      name: 'Arjun',
      email: 'arjun@gogentic.com',
    }
  })
  
  console.log('✅ Users created')
  
  // Create Canvas Enrollment Dashboard project
  const canvasProject = await prisma.project.create({
    data: {
      title: 'Canvas Enrollment Dashboard',
      branch: 'SOLUTIONS',
      pmId: matthew.id,
      developers: {
        connect: [{ id: matthew.id }]
      },
      clientName: 'Internal',
      clientEmail: 'team@gogentic.com',
      status: 'IN_PROGRESS',
      startDate: new Date('2025-01-06'),
      targetDelivery: new Date('2025-02-15'),
      notes: 'Building enrollment analytics dashboard for Canvas LMS integration',
      tasks: {
        create: [
          {
            title: 'Setup dashboard framework',
            status: 'Done',
            assigneeId: matthew.id,
            order: 0
          },
          {
            title: 'Connect Canvas API',
            status: 'Doing',
            assigneeId: matthew.id,
            order: 1
          },
          {
            title: 'Build enrollment charts',
            status: 'Doing',
            assigneeId: matthew.id,
            order: 2
          },
          {
            title: 'Add export functionality',
            status: 'Todo',
            assigneeId: matthew.id,
            order: 3
          }
        ]
      },
      updates: {
        create: [
          {
            authorId: matthew.id,
            body: 'I spent some time on the weekend building out the frontend of the dashboard. I believe this is in a really good place'
          },
          {
            authorId: matthew.id,
            body: 'Today I am working on finishing setting up the backend and connecting the canvas API'
          }
        ]
      }
    }
  })
  
  // Create Canvas-Zoho Feedback Aggregator project
  const feedbackProject = await prisma.project.create({
    data: {
      title: 'Canvas-Zoho Feedback Aggregator',
      branch: 'SOLUTIONS',
      pmId: matthew.id,
      developers: {
        connect: [{ id: mia.id }]
      },
      clientName: 'Internal',
      clientEmail: 'team@gogentic.com',
      status: 'IN_PROGRESS',
      startDate: new Date('2025-01-08'),
      targetDelivery: new Date('2025-02-01'),
      notes: 'Aggregating course feedback from Canvas into Zoho CRM',
      tasks: {
        create: [
          {
            title: 'Setup Zoho integration',
            status: 'Done',
            assigneeId: mia.id,
            order: 0
          },
          {
            title: 'Build feedback parser',
            status: 'Review',
            assigneeId: mia.id,
            order: 1
          },
          {
            title: 'Create aggregation pipeline',
            status: 'Doing',
            assigneeId: mia.id,
            order: 2
          },
          {
            title: 'Design UI dashboard',
            status: 'Todo',
            assigneeId: mia.id,
            order: 3
          }
        ]
      },
      updates: {
        create: [
          {
            authorId: matthew.id,
            body: 'Spoke to Mia this morning. She is finishing up the backend. She has Canvas connected and is pulling live course data.'
          },
          {
            authorId: matthew.id,
            body: 'The next step is for her to integrate Zoho. And then she wants to revamp the UI slightly'
          },
          {
            authorId: mia.id,
            body: 'She provided a live demo for the work-in-progress: https://course-feedback-aggregator.vercel.app/'
          }
        ]
      },
      deliverables: {
        create: [
          {
            title: 'Live Demo URL',
            status: 'Submitted',
            fileUrl: 'https://course-feedback-aggregator.vercel.app/'
          }
        ]
      }
    }
  })
  
  // Create Email Automation project
  const emailProject = await prisma.project.create({
    data: {
      title: 'Email Automation',
      branch: 'SOLUTIONS',
      pmId: matthew.id,
      developers: {
        connect: [{ id: matthew.id }]
      },
      clientName: 'External Client',
      clientEmail: 'client@external.com',
      status: 'BLOCKED',
      startDate: new Date('2025-01-10'),
      targetDelivery: new Date('2025-02-20'),
      notes: 'Email automation system requiring secondary API key access',
      tasks: {
        create: [
          {
            title: 'Get API key access',
            status: 'Review',
            assigneeId: matthew.id,
            order: 0
          },
          {
            title: 'Setup email templates',
            status: 'Todo',
            assigneeId: matthew.id,
            order: 1
          },
          {
            title: 'Configure automation rules',
            status: 'Todo',
            assigneeId: matthew.id,
            order: 2
          },
          {
            title: 'Test email delivery',
            status: 'Todo',
            assigneeId: matthew.id,
            order: 3
          }
        ]
      },
      updates: {
        create: [
          {
            authorId: matthew.id,
            body: 'Client sent additional information regarding getting us access to a secondary API key.'
          },
          {
            authorId: matthew.id,
            body: 'This was sent for review.'
          },
          {
            authorId: matthew.id,
            body: 'We are waiting for approval to move forward'
          }
        ]
      }
    }
  })
  
  // Create Badge Updates project
  const badgeProject = await prisma.project.create({
    data: {
      title: 'Badge Updates',
      branch: 'SOLUTIONS',
      pmId: matthew.id,
      developers: {
        connect: [{ id: kelly.id }]
      },
      clientName: 'Internal',
      clientEmail: 'team@gogentic.com',
      status: 'PLANNING',
      startDate: new Date('2025-01-15'),
      targetDelivery: new Date('2025-02-10'),
      notes: 'Updates to badge system',
      tasks: {
        create: [
          {
            title: 'Analyze current badge system',
            status: 'Todo',
            assigneeId: kelly.id,
            order: 0
          },
          {
            title: 'Design new badge types',
            status: 'Todo',
            assigneeId: kelly.id,
            order: 1
          },
          {
            title: 'Implement badge logic',
            status: 'Todo',
            assigneeId: kelly.id,
            order: 2
          }
        ]
      },
      updates: {
        create: [
          {
            authorId: matthew.id,
            body: 'Spoke to Kelly on Friday about having her work on this project.'
          },
          {
            authorId: matthew.id,
            body: 'She was interested and asked for more information'
          }
        ]
      }
    }
  })
  
  // Create Reputation Optimization project
  const reputationProject = await prisma.project.create({
    data: {
      title: 'Reputation Optimization',
      branch: 'SOLUTIONS',
      pmId: matthew.id,
      developers: {
        connect: [{ id: arjun.id }]
      },
      clientName: 'Internal',
      clientEmail: 'team@gogentic.com',
      status: 'PLANNING',
      startDate: new Date('2025-01-12'),
      notes: 'Strategy for online reputation management',
      tasks: {
        create: [
          {
            title: 'Research reputation strategies',
            status: 'Todo',
            assigneeId: arjun.id,
            order: 0
          },
          {
            title: 'Create implementation plan',
            status: 'Todo',
            assigneeId: arjun.id,
            order: 1
          }
        ]
      },
      updates: {
        create: [
          {
            authorId: matthew.id,
            body: 'Spoke to Arjun and he is fine with the plan of buying reddit votes.'
          },
          {
            authorId: matthew.id,
            body: 'Maybe we can have a conversation about the best way to do this'
          }
        ]
      }
    }
  })
  
  // Create AI Agents of Change project (CORTEX)
  const aiAgentsProject = await prisma.project.create({
    data: {
      title: 'AI Agents of Change Course',
      branch: 'CORTEX',
      pmId: aakansha.id,
      developers: {
        connect: [{ id: aakansha.id }]
      },
      clientName: 'Internal',
      clientEmail: 'team@gogentic.com',
      status: 'IN_PROGRESS',
      startDate: new Date('2025-01-01'),
      targetDelivery: new Date('2025-03-01'),
      notes: 'Educational course on AI agents - 8 modules total',
      tasks: {
        create: [
          {
            title: 'Module 1',
            status: 'Done',
            assigneeId: aakansha.id,
            order: 0
          },
          {
            title: 'Module 2',
            status: 'Done',
            assigneeId: aakansha.id,
            order: 1
          },
          {
            title: 'Module 3',
            status: 'Doing',
            assigneeId: aakansha.id,
            order: 2
          },
          {
            title: 'Module 4',
            status: 'Todo',
            assigneeId: aakansha.id,
            order: 3
          },
          {
            title: 'Module 5',
            status: 'Todo',
            assigneeId: aakansha.id,
            order: 4
          },
          {
            title: 'Module 6',
            status: 'Todo',
            assigneeId: aakansha.id,
            order: 5
          },
          {
            title: 'Module 7',
            status: 'Todo',
            assigneeId: aakansha.id,
            order: 6
          },
          {
            title: 'Module 8',
            status: 'Todo',
            assigneeId: aakansha.id,
            order: 7
          }
        ]
      },
      updates: {
        create: [
          {
            authorId: aakansha.id,
            body: 'Successfully delivered Module 1: Introduction to AI Agents. Students are engaged and feedback is positive.'
          },
          {
            authorId: aakansha.id,
            body: 'Module 2: Agent Architecture has been completed and delivered. 2 of 8 modules now delivered.'
          },
          {
            authorId: aakansha.id,
            body: 'Currently developing Module 3 content focusing on NLP integration with AI agents.'
          }
        ]
      },
      deliverables: {
        create: [
          {
            title: 'Module 1: Course Materials',
            status: 'Delivered',
            fileUrl: 'https://drive.google.com/module1'
          },
          {
            title: 'Module 2: Course Materials',
            status: 'Delivered',
            fileUrl: 'https://drive.google.com/module2'
          }
        ]
      }
    }
  })

  console.log('✅ Projects created with tasks and updates')
  console.log('✨ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
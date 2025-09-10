import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  Clearing existing data...')
  
  // Clear all existing data
  await prisma.timeEntry.deleteMany()
  await prisma.deliverable.deleteMany()
  await prisma.update.deleteMany()
  await prisma.task.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()
  
  console.log('✅ Existing data cleared')
  
  console.log('🌱 Seeding real data...')
  
  // Create users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Ian',
        email: 'ian@gogentic.com',
      }
    }),
    prisma.user.create({
      data: {
        name: 'Aakansha',
        email: 'aakansha@gogentic.com',
      }
    }),
    prisma.user.create({
      data: {
        name: 'Matthew',
        email: 'matthew@gogentic.com',
      }
    }),
    prisma.user.create({
      data: {
        name: 'Mia',
        email: 'mia@gogentic.com',
      }
    }),
    prisma.user.create({
      data: {
        name: 'Kelly',
        email: 'kelly@gogentic.com',
      }
    }),
    prisma.user.create({
      data: {
        name: 'Arjun',
        email: 'arjun@gogentic.com',
      }
    }),
    prisma.user.create({
      data: {
        name: 'Charlie',
        email: 'charlie@gogentic.com',
      }
    }),
    prisma.user.create({
      data: {
        name: 'Eric',
        email: 'eric@gogentic.com',
      }
    }),
    prisma.user.create({
      data: {
        name: 'Brett',
        email: 'brett@gogentic.com',
      }
    }),
  ])
  
  const [ian, aakansha, matthew, mia, kelly, arjun, charlie, eric, brett] = users
  
  console.log('✅ Users created')
  
  // Create real Solutions projects managed by Matthew
  
  // 1. Canvas Enrollment Dashboard
  const canvasDashboard = await prisma.project.create({
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
      startDate: new Date('2025-09-07'),
      notes: 'Frontend built over the weekend, now working on backend and Canvas API integration',
      tasks: {
        create: [
          {
            title: 'Build frontend dashboard',
            status: 'Done',
            assigneeId: matthew.id,
            order: 0,
            notes: 'Completed over the weekend'
          },
          {
            title: 'Set up backend infrastructure',
            status: 'Doing',
            assigneeId: matthew.id,
            order: 1,
            notes: 'Currently working on this'
          },
          {
            title: 'Connect Canvas API',
            status: 'Doing',
            assigneeId: matthew.id,
            order: 2,
            notes: 'In progress today'
          },
          {
            title: 'Test API integration',
            status: 'Todo',
            assigneeId: matthew.id,
            order: 3
          },
          {
            title: 'Deploy to production',
            status: 'Todo',
            assigneeId: matthew.id,
            order: 4
          }
        ]
      },
      updates: {
        create: [
          {
            authorId: matthew.id,
            body: 'Spent the weekend building out the frontend of the dashboard. It\'s in a really good place now.',
            createdAt: new Date('2025-09-08T10:00:00')
          },
          {
            authorId: matthew.id,
            body: 'Working on finishing the backend setup and connecting the Canvas API today.',
            createdAt: new Date('2025-09-10T09:00:00')
          }
        ]
      }
    }
  })
  
  // 2. Canvas-Zoho Feedback Aggregator
  const feedbackAggregator = await prisma.project.create({
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
      startDate: new Date('2025-09-01'),
      notes: 'Live demo available at: https://course-feedback-aggregator.vercel.app/',
      tasks: {
        create: [
          {
            title: 'Set up project structure',
            status: 'Done',
            assigneeId: mia.id,
            order: 0
          },
          {
            title: 'Build backend infrastructure',
            status: 'Done',
            assigneeId: mia.id,
            order: 1,
            notes: 'Backend is nearly complete'
          },
          {
            title: 'Connect Canvas API',
            status: 'Done',
            assigneeId: mia.id,
            order: 2,
            notes: 'Successfully pulling live course data'
          },
          {
            title: 'Integrate Zoho API',
            status: 'Doing',
            assigneeId: mia.id,
            order: 3,
            notes: 'Next step to complete'
          },
          {
            title: 'Revamp UI design',
            status: 'Todo',
            assigneeId: mia.id,
            order: 4,
            notes: 'Planned UI improvements'
          },
          {
            title: 'Testing and QA',
            status: 'Todo',
            assigneeId: mia.id,
            order: 5
          }
        ]
      },
      updates: {
        create: [
          {
            authorId: matthew.id,
            body: 'Spoke to Mia this morning. She is finishing up the backend and has Canvas connected, pulling live course data.',
            createdAt: new Date('2025-09-10T09:30:00')
          },
          {
            authorId: mia.id,
            body: 'Next step is to integrate Zoho, then revamp the UI slightly. Live demo available at: https://course-feedback-aggregator.vercel.app/',
            createdAt: new Date('2025-09-10T10:00:00')
          }
        ]
      }
    }
  })
  
  // 3. Email Automation Project
  const emailAutomation = await prisma.project.create({
    data: {
      title: 'Email Automation Project',
      branch: 'SOLUTIONS',
      pmId: matthew.id,
      developers: {
        connect: [{ id: charlie.id }, { id: eric.id }]
      },
      clientName: 'Internal',
      clientEmail: 'team@gogentic.com',
      status: 'BLOCKED',
      startDate: new Date('2025-08-25'),
      notes: 'Waiting for approval to access secondary API key',
      tasks: {
        create: [
          {
            title: 'Initial requirements gathering',
            status: 'Done',
            assigneeId: charlie.id,
            order: 0
          },
          {
            title: 'Design email automation workflow',
            status: 'Done',
            assigneeId: charlie.id,
            order: 1
          },
          {
            title: 'Get secondary API key access',
            status: 'Review',
            assigneeId: eric.id,
            order: 2,
            notes: 'Sent to Brett for review'
          },
          {
            title: 'Implement automation logic',
            status: 'Todo',
            assigneeId: charlie.id,
            order: 3,
            notes: 'Blocked - waiting for API access approval'
          },
          {
            title: 'Test automation workflows',
            status: 'Todo',
            order: 4
          }
        ]
      },
      updates: {
        create: [
          {
            authorId: eric.id,
            body: 'Sent additional information to Charlie regarding getting us access to a secondary API key.',
            createdAt: new Date('2025-09-09T14:00:00')
          },
          {
            authorId: matthew.id,
            body: 'Information was sent to Brett for review. We are waiting for approval to move forward.',
            createdAt: new Date('2025-09-10T11:00:00')
          }
        ]
      }
    }
  })
  
  // 4. Badge Updates
  const badgeUpdates = await prisma.project.create({
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
      startDate: new Date('2025-09-06'),
      notes: 'Kelly expressed interest and requested more information',
      tasks: {
        create: [
          {
            title: 'Gather detailed requirements',
            status: 'Doing',
            assigneeId: matthew.id,
            order: 0,
            notes: 'Preparing information for Kelly'
          },
          {
            title: 'Create project specification',
            status: 'Todo',
            assigneeId: matthew.id,
            order: 1
          },
          {
            title: 'Design badge system',
            status: 'Todo',
            assigneeId: kelly.id,
            order: 2
          },
          {
            title: 'Implement badge logic',
            status: 'Todo',
            assigneeId: kelly.id,
            order: 3
          }
        ]
      },
      updates: {
        create: [
          {
            authorId: matthew.id,
            body: 'Spoke to Kelly on Friday about having her work on this project. She was interested and asked for more information.',
            createdAt: new Date('2025-09-06T16:00:00')
          }
        ]
      }
    }
  })
  
  // 5. Reputation Optimization
  const reputationOpt = await prisma.project.create({
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
      startDate: new Date('2025-09-09'),
      notes: 'Exploring options for reputation management strategies',
      tasks: {
        create: [
          {
            title: 'Research reputation management strategies',
            status: 'Done',
            assigneeId: arjun.id,
            order: 0
          },
          {
            title: 'Evaluate reddit vote purchasing',
            status: 'Review',
            assigneeId: arjun.id,
            order: 1,
            notes: 'Arjun is fine with this approach'
          },
          {
            title: 'Determine best implementation approach',
            status: 'Todo',
            assigneeId: arjun.id,
            order: 2,
            notes: 'Need conversation about the best way to do this'
          },
          {
            title: 'Execute reputation strategy',
            status: 'Todo',
            assigneeId: arjun.id,
            order: 3
          }
        ]
      },
      updates: {
        create: [
          {
            authorId: matthew.id,
            body: 'Spoke to Arjun and he is fine with the plan of buying reddit votes. Maybe we can have a conversation about the best way to do this.',
            createdAt: new Date('2025-09-10T13:00:00')
          }
        ]
      }
    }
  })
  
  console.log('✅ Real projects created')
  console.log('🎉 Database seeded with real data!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
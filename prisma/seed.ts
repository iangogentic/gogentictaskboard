import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create users
  const ian = await prisma.user.create({
    data: {
      name: 'Ian',
      email: 'ian@gogentic.com',
    }
  })

  const aakansha = await prisma.user.create({
    data: {
      name: 'Aakansha',
      email: 'aakansha@gogentic.com',
    }
  })

  const matthew = await prisma.user.create({
    data: {
      name: 'Matthew',
      email: 'matthew@gogentic.com',
    }
  })

  const sarah = await prisma.user.create({
    data: {
      name: 'Sarah',
      email: 'sarah@gogentic.com',
    }
  })

  const mia = await prisma.user.create({
    data: {
      name: 'Mia',
      email: 'mia@gogentic.com',
    }
  })

  const luke = await prisma.user.create({
    data: {
      name: 'Luke',
      email: 'luke@gogentic.com',
    }
  })

  // Project A - Cortex
  const projectA = await prisma.project.create({
    data: {
      title: 'Z-School Course Build',
      branch: 'CORTEX',
      pmId: aakansha.id,
      clientName: 'Eric',
      clientEmail: 'eric@z-school.com',
      status: 'In Progress',
      startDate: new Date('2025-01-05'),
      targetDelivery: new Date('2025-02-15'),
      notes: 'Building comprehensive course materials for Z-School platform',
      developers: {
        connect: [{ id: sarah.id }]
      },
      tasks: {
        create: [
          {
            title: 'Design course structure',
            status: 'Done',
            assigneeId: sarah.id,
            order: 1,
          },
          {
            title: 'Create module 1 content',
            status: 'Done',
            assigneeId: sarah.id,
            order: 2,
          },
          {
            title: 'Build interactive exercises',
            status: 'Doing',
            assigneeId: sarah.id,
            dueDate: new Date('2025-01-20'),
            order: 3,
          },
          {
            title: 'Review and quality check',
            status: 'Todo',
            assigneeId: aakansha.id,
            dueDate: new Date('2025-02-01'),
            order: 4,
          },
          {
            title: 'Deploy to production',
            status: 'Todo',
            order: 5,
          }
        ]
      },
      updates: {
        create: [
          {
            authorId: aakansha.id,
            body: 'Project kickoff completed, requirements gathered from Eric',
            createdAt: new Date('2025-01-05T10:00:00')
          },
          {
            authorId: sarah.id,
            body: 'Course structure approved by client',
            createdAt: new Date('2025-01-08T14:30:00')
          },
          {
            authorId: sarah.id,
            body: 'Module 1 content draft completed',
            createdAt: new Date('2025-01-12T16:00:00')
          }
        ]
      }
    }
  })

  // Project B - Solutions
  const projectB = await prisma.project.create({
    data: {
      title: 'Fisher Analytics Mini-App',
      branch: 'SOLUTIONS',
      pmId: matthew.id,
      clientName: 'Fisher',
      clientEmail: 'contact@fisher.com',
      status: 'Review',
      startDate: new Date('2024-12-15'),
      targetDelivery: new Date('2025-01-30'),
      notes: 'Building analytics dashboard for Fisher data visualization',
      developers: {
        connect: [{ id: luke.id }]
      },
      tasks: {
        create: [
          {
            title: 'Setup data pipeline',
            status: 'Done',
            assigneeId: luke.id,
            order: 1,
          },
          {
            title: 'Build dashboard UI',
            status: 'Done',
            assigneeId: luke.id,
            order: 2,
          },
          {
            title: 'Implement real-time updates',
            status: 'Done',
            assigneeId: luke.id,
            order: 3,
          },
          {
            title: 'Performance optimization',
            status: 'Review',
            assigneeId: luke.id,
            order: 4,
          },
          {
            title: 'Client UAT',
            status: 'Review',
            assigneeId: matthew.id,
            dueDate: new Date('2025-01-25'),
            order: 5,
          }
        ]
      },
      updates: {
        create: [
          {
            authorId: matthew.id,
            body: 'Initial requirements documented',
            createdAt: new Date('2024-12-15T09:00:00')
          },
          {
            authorId: luke.id,
            body: 'Data pipeline connected to Fisher API',
            createdAt: new Date('2024-12-20T11:00:00')
          },
          {
            authorId: luke.id,
            body: 'Dashboard MVP ready for review',
            createdAt: new Date('2025-01-10T15:00:00')
          },
          {
            authorId: matthew.id,
            body: 'Client review session scheduled for next week',
            createdAt: new Date('2025-01-15T10:00:00')
          }
        ]
      }
    }
  })

  // Project C - Fisher
  const projectC = await prisma.project.create({
    data: {
      title: 'Onboarding Portal',
      branch: 'FISHER',
      pmId: ian.id,
      clientName: 'Internal',
      clientEmail: 'hr@gogentic.com',
      status: 'Not Started',
      targetDelivery: new Date('2025-03-01'),
      notes: 'New employee onboarding system for internal use',
      developers: {
        connect: [{ id: mia.id }, { id: luke.id }]
      },
      tasks: {
        create: [
          {
            title: 'Gather requirements from HR',
            status: 'Todo',
            assigneeId: ian.id,
            dueDate: new Date('2025-01-25'),
            order: 1,
          },
          {
            title: 'Design user flow',
            status: 'Todo',
            assigneeId: mia.id,
            order: 2,
          },
          {
            title: 'Setup authentication',
            status: 'Todo',
            assigneeId: luke.id,
            order: 3,
          },
          {
            title: 'Build onboarding forms',
            status: 'Todo',
            order: 4,
          },
          {
            title: 'Integration testing',
            status: 'Todo',
            order: 5,
          }
        ]
      },
      updates: {
        create: [
          {
            authorId: ian.id,
            body: 'Project approved by leadership',
            createdAt: new Date('2025-01-10T09:00:00')
          }
        ]
      }
    }
  })

  console.log('Seed data created successfully!')
  console.log(`Created ${await prisma.user.count()} users`)
  console.log(`Created ${await prisma.project.count()} projects`)
  console.log(`Created ${await prisma.task.count()} tasks`)
  console.log(`Created ${await prisma.update.count()} updates`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
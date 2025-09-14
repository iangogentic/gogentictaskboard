export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Step 1: Get all Ian accounts
    const ianAccounts = await prisma.user.findMany({
      where: {
        email: {
          in: ['ian@gogentic.com', 'ianigreenberg@gmail.com', 'ian@gogentic.ai']
        }
      }
    })

    // Find the primary account (ian@gogentic.ai)
    const primaryAccount = ianAccounts.find(u => u.email === 'ian@gogentic.ai')
    const duplicateAccounts = ianAccounts.filter(u => u.email !== 'ian@gogentic.ai')

    if (!primaryAccount) {
      return NextResponse.json({ error: 'Primary account ian@gogentic.ai not found' }, { status: 404 })
    }

    const migrationReport = {
      primary: primaryAccount,
      duplicates: duplicateAccounts,
      migrated: {
        projects: 0,
        tasks: 0,
        updates: 0,
        timeEntries: 0,
        developerRoles: 0
      }
    }

    // Step 2: Migrate data from duplicates to primary
    for (const duplicate of duplicateAccounts) {
      // Migrate projects where duplicate is PM
      const projectsUpdated = await prisma.project.updateMany({
        where: { pmId: duplicate.id },
        data: { pmId: primaryAccount.id }
      })
      migrationReport.migrated.projects += projectsUpdated.count

      // Migrate tasks assigned to duplicate
      const tasksUpdated = await prisma.task.updateMany({
        where: { assigneeId: duplicate.id },
        data: { assigneeId: primaryAccount.id }
      })
      migrationReport.migrated.tasks += tasksUpdated.count

      // Migrate updates authored by duplicate
      const updatesUpdated = await prisma.update.updateMany({
        where: { authorId: duplicate.id },
        data: { authorId: primaryAccount.id }
      })
      migrationReport.migrated.updates += updatesUpdated.count

      // Migrate time entries
      const timeEntriesUpdated = await prisma.timeEntry.updateMany({
        where: { userId: duplicate.id },
        data: { userId: primaryAccount.id }
      })
      migrationReport.migrated.timeEntries += timeEntriesUpdated.count

      // Get projects where duplicate is developer
      const developerProjects = await prisma.project.findMany({
        where: {
          developers: {
            some: { id: duplicate.id }
          }
        }
      })

      // Remove duplicate as developer and add primary if not already there
      for (const project of developerProjects) {
        await prisma.project.update({
          where: { id: project.id },
          data: {
            developers: {
              disconnect: { id: duplicate.id },
              connect: { id: primaryAccount.id }
            }
          }
        })
        migrationReport.migrated.developerRoles++
      }
    }

    // Step 3: Delete duplicate accounts
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: {
          in: ['ian@gogentic.com', 'ianigreenberg@gmail.com']
        }
      }
    })

    // Step 4: Get final user list to confirm
    const remainingUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      migrationReport,
      deletedCount: deletedUsers.count,
      remainingUsers
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup duplicate accounts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
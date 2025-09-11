import { prisma } from '@/lib/prisma'
import { MyWorkClient } from './my-work-client'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function MyWorkPage() {
  const cookieStore = await cookies()
  const currentUserEmail = cookieStore.get('currentUser')?.value || 'ian@gogentic.com'
  
  const currentUser = await prisma.user.findUnique({
    where: { email: currentUserEmail }
  })

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h2>
          <p className="text-gray-600">Please select a user from the user switcher</p>
        </div>
      </div>
    )
  }

  const [tasks, projects, timeEntries] = await Promise.all([
    prisma.task.findMany({
      where: {
        assigneeId: currentUser.id,
      },
      include: {
        project: {
          include: {
            pm: true,
          }
        },
        assignee: true,
      },
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    }),
    prisma.project.findMany({
      where: {
        OR: [
          { pmId: currentUser.id },
          { developers: { some: { id: currentUser.id } } }
        ]
      },
      include: {
        pm: true,
        developers: true,
        tasks: true,
      }
    }),
    prisma.timeEntry.findMany({
      where: {
        userId: currentUser.id,
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      },
      include: {
        task: true,
      },
      orderBy: { date: 'desc' }
    })
  ])

  // Calculate today's total time
  const todayMinutes = timeEntries.reduce((sum, entry) => {
    return sum + Math.round((entry.hours || 0) * 60)
  }, 0)

  const activeTimer = null // Timer functionality would need separate implementation

  return <MyWorkClient 
    tasks={tasks}
    projects={projects}
    currentUser={currentUser}
    timeEntries={timeEntries}
    todayMinutes={todayMinutes}
    activeTimer={activeTimer}
  />
}
import { prisma } from '@/lib/db'
import MyWorkClientPage from './client-page'

export const dynamic = 'force-dynamic'

export default async function MyWorkPage() {
  const tasks = await prisma.task.findMany({
    include: {
      project: {
        include: { pm: true }
      },
      assignee: true,
    },
    orderBy: [
      { status: 'asc' },
      { dueDate: 'asc' },
    ],
  })

  return <MyWorkClientPage allTasks={tasks} />
}
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

export const revalidate = 60

export default async function SimpleSharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  
  try {
    const project = await prisma.project.findUnique({
      where: { clientShareToken: token },
      select: {
        id: true,
        title: true,
        branch: true,
        status: true,
        clientName: true,
        clientEmail: true,
      }
    })

    if (!project) {
      notFound()
    }

    return (
      <div className="min-h-screen bg-surface p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h1 className="text-2xl font-bold text-fg mb-4">Project Status</h1>
            <p className="text-sm text-muted mb-4">Read-only view for {project.clientName}</p>
            
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">{project.title}</h2>
                <p className="text-sm text-muted">Branch: {project.branch}</p>
                <p className="text-sm text-muted">Status: {project.status}</p>
                <p className="text-sm text-muted">Client: {project.clientEmail}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading project:', error)
    return (
      <div className="min-h-screen bg-surface p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h1 className="text-2xl font-bold text-fg">Error Loading Project</h1>
            <p className="text-sm text-muted">Please try again later</p>
          </div>
        </div>
      </div>
    )
  }
}
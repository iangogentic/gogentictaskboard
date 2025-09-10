import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Generate a new token
    const newToken = crypto.randomUUID()

    // Update the project with the new token
    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: { clientShareToken: newToken },
    })

    return NextResponse.json({ token: updatedProject.clientShareToken })
  } catch (error) {
    console.error('Error regenerating token:', error)
    return NextResponse.json({ error: 'Failed to regenerate token' }, { status: 500 })
  }
}
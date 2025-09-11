import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { projectId, authorId, body: updateBody } = body

    const update = await prisma.update.create({
      data: {
        projectId,
        authorId,
        body: updateBody,
      },
      include: {
        author: true,
        project: true,
      },
    })

    return NextResponse.json(update)
  } catch (error) {
    console.error('Error creating update:', error)
    return NextResponse.json({ error: 'Failed to create update' }, { status: 500 })
  }
}

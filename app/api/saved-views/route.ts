export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')
  const viewType = searchParams.get('viewType')

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }

  try {
    const views = await prisma.savedView.findMany({
      where: {
        userId,
        ...(viewType && { viewType })
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(views)
  } catch (error) {
    console.error('Error fetching saved views:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved views' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, viewType, filters, sortBy, sortOrder } = body

    if (!userId || !name || !viewType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if view with same name exists
    const existing = await prisma.savedView.findUnique({
      where: {
        userId_name_viewType: {
          userId,
          name,
          viewType
        }
      }
    })

    if (existing) {
      // Update existing view
      const updated = await prisma.savedView.update({
        where: { id: existing.id },
        data: {
          filters,
          sortBy,
          sortOrder,
          updatedAt: new Date()
        }
      })
      return NextResponse.json(updated)
    }

    // Create new view
    const view = await prisma.savedView.create({
      data: {
        userId,
        name,
        viewType,
        filters: filters || {},
        sortBy,
        sortOrder
      }
    })

    return NextResponse.json(view)
  } catch (error) {
    console.error('Error creating saved view:', error)
    return NextResponse.json(
      { error: 'Failed to create saved view' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get('id')
  const userId = searchParams.get('userId')

  if (!id || !userId) {
    return NextResponse.json(
      { error: 'ID and User ID required' },
      { status: 400 }
    )
  }

  try {
    // Verify ownership
    const view = await prisma.savedView.findFirst({
      where: { id, userId }
    })

    if (!view) {
      return NextResponse.json(
        { error: 'View not found or unauthorized' },
        { status: 404 }
      )
    }

    await prisma.savedView.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting saved view:', error)
    return NextResponse.json(
      { error: 'Failed to delete saved view' },
      { status: 500 }
    )
  }
}
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const portfolios = await prisma.portfolio.findMany({
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(portfolios)
  } catch (error) {
    console.error('Error fetching portfolios:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portfolios' },
      { status: 500 }
    )
  }
}
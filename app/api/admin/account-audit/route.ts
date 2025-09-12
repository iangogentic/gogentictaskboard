import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  // Security checks
  if (process.env.AUTH_DEBUG?.trim() !== 'true') {
    return NextResponse.json({ error: 'Admin endpoint disabled' }, { status: 403 })
  }
  
  const adminKey = req.headers.get('X-ADMIN-KEY')
  if (!adminKey || adminKey !== process.env.ADMIN_FIX_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    // Get all Google OAuth accounts
    const accounts = await prisma.account.findMany({
      where: {
        provider: 'google'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        user: {
          email: 'asc'
        }
      }
    })
    
    const results = accounts.map(acc => ({
      account_id: acc.id,
      user_id: acc.userId,
      email: acc.user.email,
      name: acc.user.name,
      providerAccountId: acc.providerAccountId
    }))
    
    // Log for debugging
    console.log(`ADMIN: Audited ${results.length} Google accounts`)
    
    return NextResponse.json({
      google_accounts: results,
      total: results.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to audit accounts:', error)
    return NextResponse.json({ 
      error: 'Failed to audit accounts',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
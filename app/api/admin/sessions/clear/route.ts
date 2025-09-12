import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // Security checks
  console.log('AUTH_DEBUG value:', process.env.AUTH_DEBUG)
  if (process.env.AUTH_DEBUG?.trim() !== 'true') {
    return NextResponse.json({ 
      error: 'Admin endpoint disabled',
      auth_debug: process.env.AUTH_DEBUG,
      env_keys: Object.keys(process.env).filter(k => k.includes('AUTH')).length
    }, { status: 403 })
  }
  
  const adminKey = req.headers.get('X-ADMIN-KEY')
  if (!adminKey || adminKey !== process.env.ADMIN_FIX_TOKEN?.trim()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    // Clear all sessions
    const result = await prisma.session.deleteMany()
    
    console.log(`ADMIN: Cleared ${result.count} sessions`)
    
    return NextResponse.json({ 
      deleted: result.count,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to clear sessions:', error)
    return NextResponse.json({ 
      error: 'Failed to clear sessions',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
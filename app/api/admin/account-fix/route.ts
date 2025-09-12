import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // Security checks
  if (process.env.AUTH_DEBUG !== 'true') {
    return NextResponse.json({ error: 'Admin endpoint disabled' }, { status: 403 })
  }
  
  const adminKey = req.headers.get('X-ADMIN-KEY')
  if (!adminKey || adminKey !== process.env.ADMIN_FIX_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { accountId } = await req.json()
    
    if (!accountId) {
      return NextResponse.json({ error: 'accountId required' }, { status: 400 })
    }
    
    // Get account details before deletion for logging
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    })
    
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }
    
    // Delete the account
    await prisma.account.delete({
      where: { id: accountId }
    })
    
    console.log(`ADMIN: Deleted OAuth account ${accountId} for user ${account.user.email}`)
    
    return NextResponse.json({ 
      deleted: 1,
      account_id: accountId,
      user_email: account.user.email,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to fix account:', error)
    return NextResponse.json({ 
      error: 'Failed to fix account',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
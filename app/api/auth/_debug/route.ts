import { auth } from '@/auth'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // Only enable in debug mode
  if (process.env.AUTH_DEBUG !== 'true') {
    return NextResponse.json({ error: 'Debug endpoint disabled' }, { status: 403 })
  }

  try {
    // Get session
    const session = await auth()
    
    // Get cookies (names only, no values for security)
    const cookieStore = await cookies()
    const cookieNames = Array.from(cookieStore.getAll()).map(c => c.name)
    
    // Get request info
    const host = req.headers.get('host') || 'unknown'
    const nextauthUrl = process.env.NEXTAUTH_URL || 'not set'
    
    // Extract session info safely
    const sessionUser = session?.user ? {
      id: session.user.id || null,
      email: session.user.email || null,
      name: session.user.name || null,
      role: (session.user as any).role || null
    } : null
    
    // Token claims (if available from session)
    const tokenClaims = session ? {
      sub: (session as any).sub || null,
      userId: (session as any).userId || null,
      iat: (session as any).iat || null,
      exp: (session as any).exp || null
    } : null
    
    return NextResponse.json({
      debug: true,
      timestamp: new Date().toISOString(),
      host,
      nextauthUrl,
      cookies: cookieNames,
      sessionUser,
      tokenClaims,
      authenticated: !!session
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get debug info',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
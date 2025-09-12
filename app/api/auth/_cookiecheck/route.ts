import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // Only enable in debug mode
  if (process.env.AUTH_DEBUG !== 'true') {
    return NextResponse.json({ error: 'Debug endpoint disabled' }, { status: 403 })
  }

  try {
    const cookieStore = await cookies()
    const allCookies = Array.from(cookieStore.getAll())
    
    // Get request info
    const host = req.headers.get('host') || 'unknown'
    const nextauthUrl = process.env.NEXTAUTH_URL || 'not set'
    
    // Check for URL mismatch
    const urlMismatch = nextauthUrl && !nextauthUrl.includes(host.split(':')[0])
    
    if (urlMismatch) {
      console.warn(`AUTH_DEBUG: NEXTAUTH_URL (${nextauthUrl}) does not match request host (${host})`)
    }
    
    // Find auth-related cookies
    const authCookies = allCookies
      .filter(c => 
        c.name.includes('authjs') || 
        c.name.includes('next-auth') ||
        c.name === 'currentUser' ||
        c.name === 'demo-user' ||
        c.name === 'user-switcher'
      )
      .map(c => ({
        name: c.name,
        // Parse cookie attributes from the cookie (if available)
        attributes: {
          httpOnly: c.name.includes('authjs'), // Auth cookies should be httpOnly
          secure: true, // Should always be true in production
          sameSite: 'lax',
          path: '/',
          domain: req.headers.get('host')?.split(':')[0] || 'unknown'
        }
      }))
    
    // Check for problematic cookies
    const problematicCookies = allCookies
      .filter(c => 
        c.name === 'currentUser' || 
        c.name === 'demo-user' || 
        c.name === 'user-switcher'
      )
      .map(c => c.name)
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      host,
      nextauthUrl,
      urlMismatch,
      authCookies,
      problematicCookies: problematicCookies.length > 0 ? problematicCookies : null,
      totalCookies: allCookies.length,
      warnings: [
        urlMismatch && 'NEXTAUTH_URL does not match request host',
        problematicCookies.length > 0 && `Found problematic cookies: ${problematicCookies.join(', ')}`
      ].filter(Boolean)
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check cookies',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAuthedUser } from '@/lib/getAuthedUser'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

export async function GET() {
  try {
    // Get NextAuth session
    const session = await auth()
    const sessionUser = session?.user ? {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name
    } : null

    // Get app's current user using the new helper
    let appUser = null
    let appUserSource = 'NOT_FOUND'
    
    try {
      if (session?.user?.email) {
        const user = await getAuthedUser()
        if (user) {
          appUser = {
            id: user.id,
            email: user.email,
            name: user.name
          }
          appUserSource = 'getAuthedUser() helper using NextAuth session'
        }
      }
    } catch (e) {
      appUser = { error: (e as Error).message }
      appUserSource = 'Error calling getAuthedUser()'
    }

    // Also check for any lingering cookies (should be empty in production)
    const cookieStore = await cookies()
    const legacyCookies = {
      currentUser: cookieStore.get('currentUser')?.value || null,
      demoUser: cookieStore.get('demo-user')?.value || null,
      userSwitcher: cookieStore.get('user-switcher')?.value || null
    }

    // Check if they match
    const equal = !!sessionUser?.id && !!appUser && 'id' in appUser && sessionUser.id === appUser.id

    return NextResponse.json({
      sessionUser,
      appUser,
      appUserSource,
      equal,
      legacyCookies,
      environment: process.env.NODE_ENV
    })
  } catch (error) {
    console.error('Whoami probe error:', error)
    return NextResponse.json({ 
      error: 'Failed to probe user identity',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
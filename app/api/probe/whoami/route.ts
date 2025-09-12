import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
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

    // Get app's current user (mimic my-work logic)
    const cookieStore = await cookies()
    const currentUserEmail = cookieStore.get('currentUser')?.value || 'ian@gogentic.com'
    
    let appUser = null
    let appUserSource = 'NOT_FOUND'
    
    if (currentUserEmail) {
      const user = await prisma.user.findUnique({
        where: { email: currentUserEmail }
      })
      
      if (user) {
        appUser = {
          id: user.id,
          email: user.email,
          name: user.name
        }
        appUserSource = `Cookie 'currentUser' = '${currentUserEmail}' -> DB lookup`
      }
    }

    // Check if they match
    const equal = sessionUser?.id === appUser?.id

    return NextResponse.json({
      sessionUser,
      appUser,
      appUserSource,
      equal,
      cookieValue: currentUserEmail,
      fallback: 'ian@gogentic.com'
    })
  } catch (error) {
    console.error('Whoami probe error:', error)
    return NextResponse.json({ 
      error: 'Failed to probe user identity',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
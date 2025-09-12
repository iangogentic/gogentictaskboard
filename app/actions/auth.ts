'use server'

import { signOut } from '@/auth'
import { cookies } from 'next/headers'

export async function handleSignOut() {
  // Clear any potential demo/bypass cookies
  const cookieStore = await cookies()
  
  // Remove any legacy cookies that might interfere
  const cookiesToClear = ['currentUser', 'demo-user', 'user-switcher']
  
  cookiesToClear.forEach(cookieName => {
    if (cookieStore.has(cookieName)) {
      cookieStore.delete(cookieName)
    }
  })
  
  // Perform NextAuth signOut
  await signOut({ 
    redirectTo: '/login',
    redirect: true 
  })
}
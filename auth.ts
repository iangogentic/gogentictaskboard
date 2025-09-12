import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import authConfig from "@/auth.config"

const isDebug = process.env.AUTH_DEBUG === 'true'

export const { 
  handlers, 
  auth, 
  signIn, 
  signOut 
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (isDebug) {
        console.warn('AUTH_DEBUG: signIn callback', {
          provider: account?.provider,
          email: user?.email,
          providerAccountId: account?.providerAccountId,
          userId: user?.id
        })
      }
      // Let NextAuth handle the sign in
      return true
    },
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub
      }

      if (token.role && session.user) {
        session.user.role = token.role as string
      }

      if (isDebug) {
        console.warn('AUTH_DEBUG: session callback', {
          sessionUserId: session.user?.id,
          sessionUserEmail: session.user?.email,
          tokenSub: token.sub
        })
      }

      return session
    },
    async jwt({ token, user, account }) {
      // On initial sign in
      if (user) {
        token.sub = user.id
        if (isDebug) {
          console.warn('AUTH_DEBUG: jwt callback (initial sign in)', {
            tokenSub: token.sub,
            userId: user.id,
            userEmail: user.email
          })
        }
      }
      
      if (!token.sub) return token

      const existingUser = await prisma.user.findUnique({
        where: { id: token.sub }
      })

      if (!existingUser) return token

      token.role = existingUser.role

      if (isDebug) {
        console.warn('AUTH_DEBUG: jwt callback (existing user)', {
          tokenSub: token.sub,
          existingUserEmail: existingUser.email,
          existingUserId: existingUser.id
        })
      }

      return token
    }
  },
  ...authConfig,
})
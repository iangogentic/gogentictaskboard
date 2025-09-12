import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import authConfig from "@/auth.config"

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
      // For OAuth providers, ensure we're creating/linking the correct user
      if (account?.provider === "google" || account?.provider === "github") {
        // This will create a new user if they don't exist, or link to existing
        // NextAuth handles this with the PrismaAdapter
        return true
      }
      return true
    },
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub
      }

      if (token.role && session.user) {
        session.user.role = token.role as string
      }

      return session
    },
    async jwt({ token, user, account }) {
      // When user signs in, add their info to the token
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      
      if (!token.sub) return token

      const existingUser = await prisma.user.findUnique({
        where: { id: token.sub }
      })

      if (!existingUser) return token

      token.role = existingUser.role

      return token
    }
  },
  ...authConfig,
})
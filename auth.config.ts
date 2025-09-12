import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"

// Only import credentials-related deps if enabled
const enableCredentials = process.env.ENABLE_CREDENTIALS_AUTH === 'true'

async function getCredentialsProvider() {
  if (!enableCredentials) return null
  
  // Dynamic imports to avoid Edge Function bloat
  const Credentials = (await import("next-auth/providers/credentials")).default
  const bcrypt = (await import("bcryptjs")).default
  const prisma = (await import("@/lib/prisma")).default
  
  return Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null
      }

      const user = await prisma.user.findUnique({
        where: {
          email: credentials.email as string
        }
      })

      if (!user || !user.password) {
        return null
      }

      const passwordsMatch = await bcrypt.compare(
        credentials.password as string,
        user.password
      )

      if (!passwordsMatch) {
        return null
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    }
  })
}

// OAuth providers are always available
const oauthProviders = [
  Google({
    clientId: process.env.AUTH_GOOGLE_ID,
    clientSecret: process.env.AUTH_GOOGLE_SECRET,
  }),
  GitHub({
    clientId: process.env.AUTH_GITHUB_ID,
    clientSecret: process.env.AUTH_GITHUB_SECRET,
  }),
]

// Export a function to get providers dynamically
export async function getProviders() {
  const providers = [...oauthProviders]
  
  if (enableCredentials) {
    const credentialsProvider = await getCredentialsProvider()
    if (credentialsProvider) {
      providers.push(credentialsProvider)
    }
  }
  
  return providers
}

// For Edge runtime (middleware), export OAuth-only config
export default {
  providers: oauthProviders,
} satisfies NextAuthConfig
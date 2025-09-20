import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import authConfig from "@/auth.config";

const isDebug = process.env.AUTH_DEBUG === "true";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;

          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user || !user.password) return null;

          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
              role: user.role,
            };
          }
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (isDebug) {
        console.warn("AUTH_DEBUG: signIn callback", {
          provider: account?.provider,
          email: user?.email,
          providerAccountId: account?.providerAccountId,
          userId: user?.id,
        });
      }
      // Let NextAuth handle the sign in
      return true;
    },
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role as string;
      }

      if (isDebug) {
        console.warn("AUTH_DEBUG: session callback", {
          sessionUserId: session.user?.id,
          sessionUserEmail: session.user?.email,
          tokenSub: token.sub,
        });
      }

      return session;
    },
    async jwt({ token, user, account }) {
      // On initial sign in
      if (user) {
        token.sub = user.id;
        if (isDebug) {
          console.warn("AUTH_DEBUG: jwt callback (initial sign in)", {
            tokenSub: token.sub,
            userId: user.id,
            userEmail: user.email,
          });
        }
      }

      if (!token.sub) return token;

      const existingUser = await prisma.user.findUnique({
        where: { id: token.sub },
      });

      if (!existingUser) return token;

      token.role = existingUser.role;

      if (isDebug) {
        console.warn("AUTH_DEBUG: jwt callback (existing user)", {
          tokenSub: token.sub,
          existingUserEmail: existingUser.email,
          existingUserId: existingUser.id,
        });
      }

      return token;
    },
  },
});

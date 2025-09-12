// lib/getAuthedUser.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export async function getAuthedUserOrRedirect() {
  const session = await auth()
  if (!session?.user?.email) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, name: true, role: true },
  })
  if (!user) {
    // Optional: create the user on first login or send to onboarding
    throw new Error(`User not found for ${session.user.email}`)
  }
  return user
}

export async function getAuthedUser() {
  const session = await auth()
  if (!session?.user?.email) return null

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, name: true, role: true },
  })
  return user
}
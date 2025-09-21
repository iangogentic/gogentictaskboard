import { getServerSession } from "next-auth/react";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminUsersClient from "./client";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  // Get the current user and check if they're admin
  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, id: true },
  });

  if (currentUser?.role !== "admin") {
    redirect("/glass-home");
  }

  // Get all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return <AdminUsersClient users={users} currentUserId={currentUser.id} />;
}

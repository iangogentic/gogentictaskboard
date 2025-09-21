import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ClientWrapper from "./client-wrapper";

export const dynamic = "force-dynamic";
export const revalidate = 60;

async function getUsers() {
  const users = await prisma.user.findMany({
    include: {
      projectsAsPM: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
      projectsAsDev: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
      _count: {
        select: {
          projectsAsPM: true,
          projectsAsDev: true,
          tasks: true,
          updates: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
  return users;
}

export default async function UsersPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const users = await getUsers();

  return <ClientWrapper users={users} />;
}

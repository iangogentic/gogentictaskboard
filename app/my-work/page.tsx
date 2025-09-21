import { prisma } from "@/lib/prisma";
import { MyWorkClient } from "./my-work-client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { GlassNav } from "@/components/glass";
import { AnimatedBackground } from "@/components/glass/AnimatedBackground";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function MyWorkPage() {
  // Get the authenticated user from NextAuth
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!currentUser) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <AnimatedBackground />
        <GlassNav />
        <div className="relative z-10 min-h-screen flex items-center justify-center pt-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white/90 mb-2">
              User Not Found
            </h2>
            <p className="text-white/70">
              Your email ({session.user.email}) is not registered in the system
            </p>
          </div>
        </div>
      </div>
    );
  }

  const [tasks, projects, timeEntries] = await Promise.all([
    prisma.task.findMany({
      where: {
        assigneeId: currentUser.id,
      },
      include: {
        project: {
          include: {
            pm: true,
            portfolio: true,
          },
        },
        assignee: true,
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    }),
    prisma.project.findMany({
      where: {
        OR: [
          { pmId: currentUser.id },
          { developers: { some: { id: currentUser.id } } },
        ],
      },
      include: {
        pm: true,
        developers: true,
        tasks: true,
        portfolio: true,
      },
    }),
    prisma.timeEntry.findMany({
      where: {
        userId: currentUser.id,
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      include: {
        task: true,
      },
      orderBy: { date: "desc" },
    }),
  ]);

  // Calculate today's total time
  const todayMinutes = timeEntries.reduce((sum, entry) => {
    return sum + Math.round((entry.hours || 0) * 60);
  }, 0);

  const activeTimer = null; // Timer functionality would need separate implementation

  return (
    <MyWorkClient
      tasks={tasks}
      projects={projects}
      currentUser={currentUser}
      timeEntries={timeEntries}
      todayMinutes={todayMinutes}
      activeTimer={activeTimer}
    />
  );
}

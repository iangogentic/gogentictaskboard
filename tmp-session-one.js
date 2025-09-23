const { PrismaClient } = require("./node_modules/@prisma/client");
const prisma = new PrismaClient();

(async () => {
  const sessions = await prisma.agentSession.findMany({
    where: { plan: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 1,
  });

  for (const s of sessions) {
    console.log(
      JSON.stringify(
        {
          id: s.id,
          userId: s.userId,
          state: s.state,
          hasPlan: !!s.plan,
          planId: s.plan?.id,
        },
        null,
        2
      )
    );
  }

  await prisma.$disconnect();
})();

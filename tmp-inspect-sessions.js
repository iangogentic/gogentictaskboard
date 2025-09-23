const { PrismaClient } = require("./node_modules/@prisma/client");
const prisma = new PrismaClient();

(async () => {
  const sessions = await prisma.agentSession.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  for (const s of sessions) {
    console.log(
      JSON.stringify(
        {
          id: s.id,
          hasPlan: !!s.plan,
          state: s.state,
          createdAt: s.createdAt,
          planType: typeof s.plan,
          plan: s.plan,
        },
        null,
        2
      )
    );
  }

  await prisma.$disconnect();
})();

const { PrismaClient } = require("./node_modules/@prisma/client");
const prisma = new PrismaClient();

(async () => {
  const counts = await prisma.agentSession.groupBy({
    by: ["state"],
    _count: { _all: true },
  });
  console.log("State counts:", counts);
  const nullPlans = await prisma.agentSession.count({ where: { plan: null } });
  console.log("Sessions with null plan:", nullPlans);
  const awaiting = await prisma.agentSession.findMany({
    where: { state: "awaiting_approval" },
    take: 5,
  });
  console.log(
    "Awaiting approval sample:",
    awaiting.map((s) => ({ id: s.id, plan: !!s.plan }))
  );
  await prisma.$disconnect();
})();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkIanSlack() {
  try {
    // Check Ian's Slack integration
    const ian = await prisma.user.findFirst({
      where: { email: "ian@gogentic.ai" },
    });

    console.log("Ian User ID:", ian?.id);

    if (ian) {
      const slackCred = await prisma.integrationCredential.findFirst({
        where: {
          userId: ian.id,
          type: "slack",
        },
      });

      if (slackCred) {
        console.log("\n✅ Slack Integration Found!");
        console.log("Created:", slackCred.createdAt);
        console.log("Updated:", slackCred.updatedAt);
        console.log("ID:", slackCred.id);
        const data = slackCred.data;
        console.log("Data keys:", Object.keys(data));
        if (data.team) {
          console.log("Team:", data.team.name || data.team.id);
        }
        if (data.authed_user) {
          console.log("Slack User ID:", data.authed_user.id);
        }
      } else {
        console.log("\n❌ NO Slack integration found for Ian");
      }
    }

    // Check all Slack integrations
    const allSlack = await prisma.integrationCredential.findMany({
      where: { type: "slack" },
      select: {
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });

    console.log("\n=== Recent Slack integrations (last 5) ===");
    for (const cred of allSlack) {
      const user = await prisma.user.findUnique({
        where: { id: cred.userId },
        select: { name: true, email: true },
      });
      const timeAgo = new Date() - new Date(cred.updatedAt);
      const minsAgo = Math.floor(timeAgo / 60000);
      console.log(`- ${user?.name} (${user?.email}) - ${minsAgo} mins ago`);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkIanSlack().catch(console.error);

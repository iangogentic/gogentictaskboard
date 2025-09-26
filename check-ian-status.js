const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkIan() {
  try {
    // Find Ian's user
    const ianUsers = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: "Ian", mode: "insensitive" } },
          { email: { contains: "ian", mode: "insensitive" } },
        ],
      },
    });

    console.log("=== Ian User(s) Found ===");
    for (const user of ianUsers) {
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`User ID: ${user.id}`);

      // Check for Slack integration
      const slackIntegration = await prisma.integrationCredential.findFirst({
        where: {
          userId: user.id,
          type: "slack",
        },
      });
      console.log(`Has Slack Integration: ${slackIntegration !== null}`);

      // Check projects where Ian is PM
      const pmProjects = await prisma.project.findMany({
        where: { pmId: user.id },
      });

      // Check projects where Ian is a member
      const memberProjects = await prisma.project.findMany({
        where: {
          ProjectMember: {
            some: {
              userId: user.id,
              role: { in: ["owner", "member"] },
            },
          },
        },
      });

      const allProjects = [...pmProjects, ...memberProjects];
      const uniqueProjects = Array.from(
        new Map(allProjects.map((p) => [p.id, p])).values()
      );

      console.log(`Total Projects: ${uniqueProjects.length}`);
      const activeProjects = uniqueProjects.filter((p) =>
        ["In Progress", "Not Started", "Blocked"].includes(p.status)
      );
      console.log(
        `Active Projects (eligible for Slack): ${activeProjects.length}`
      );

      if (activeProjects.length > 0) {
        console.log("Active project details:");
        activeProjects.forEach((p) => {
          console.log(
            `  - ${p.title} (Status: ${p.status}, Last Updated: ${p.lastUpdatedAt})`
          );
        });
      } else {
        console.log(
          "  No active projects - this is why you're not getting Slack messages!"
        );
      }
      console.log("---");
    }

    // Show all users with active projects
    console.log(
      "\n=== Users WITH Active Projects (who get Slack messages) ==="
    );
    const usersWithActiveProjects = await prisma.user.findMany({
      where: {
        OR: [
          {
            projectsAsPM: {
              some: {
                status: { in: ["In Progress", "Not Started", "Blocked"] },
              },
            },
          },
          {
            ProjectMember: {
              some: {
                project: {
                  status: { in: ["In Progress", "Not Started", "Blocked"] },
                },
              },
            },
          },
        ],
      },
    });

    for (const user of usersWithActiveProjects) {
      const projects = await prisma.project.findMany({
        where: {
          AND: [
            {
              OR: [
                { pmId: user.id },
                {
                  ProjectMember: {
                    some: {
                      userId: user.id,
                      role: { in: ["owner", "member"] },
                    },
                  },
                },
              ],
            },
            {
              status: { in: ["In Progress", "Not Started", "Blocked"] },
            },
          ],
        },
      });

      // Check for Slack integration
      const slackIntegration = await prisma.integrationCredential.findFirst({
        where: {
          userId: user.id,
          type: "slack",
        },
      });

      console.log(`${user.name} (${user.email})`);
      console.log(`  - Has Slack: ${slackIntegration !== null ? "YES" : "NO"}`);
      console.log(`  - Active Projects: ${projects.length}`);
      projects.forEach((p) => {
        console.log(`    * ${p.title} (${p.status})`);
      });
    }

    // Show all active projects
    console.log("\n=== All Active Projects in System ===");
    const allActive = await prisma.project.findMany({
      where: {
        status: { in: ["In Progress", "Not Started", "Blocked"] },
      },
      include: {
        pm: { select: { name: true, email: true } },
      },
    });

    console.log(`Total active projects: ${allActive.length}`);
    allActive.forEach((p) => {
      console.log(`- ${p.title} (${p.status})`);
      console.log(
        `  PM: ${p.pm?.name || "None"} ${p.pm?.email ? `(${p.pm.email})` : ""}`
      );
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkIan().catch(console.error);

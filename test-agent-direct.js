// Direct test of agent tools to debug the issue
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testDatabase() {
  console.log("Testing database connection...");

  try {
    // Test database connection
    const userCount = await prisma.user.count();
    console.log(`✅ Database connected. Users in database: ${userCount}`);

    // Get a sample user
    const user = await prisma.user.findFirst();
    if (user) {
      console.log(`✅ Found user: ${user.name} (${user.email})`);

      // Test project query
      const projects = await prisma.project.findMany({
        take: 5,
      });
      console.log(`✅ Found ${projects.length} projects`);

      if (projects.length > 0) {
        const projectId = projects[0].id;
        console.log(`\nTesting analyzeProject with projectId: ${projectId}...`);

        // Test the analyzeProject functionality
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          include: {
            tasks: true,
            updates: {
              orderBy: { createdAt: "desc" },
              take: 5,
            },
            projectMembers: {
              include: { user: true },
            },
          },
        });

        if (project) {
          const totalTasks = project.tasks.length;
          const completedTasks = project.tasks.filter(
            (t) => t.status === "Complete"
          ).length;
          const inProgressTasks = project.tasks.filter(
            (t) => t.status === "In Progress"
          ).length;
          const blockedTasks = project.tasks.filter(
            (t) => t.status === "Blocked"
          ).length;

          console.log(`\n📊 Project Analysis for "${project.title}":`);
          console.log(`- Total Tasks: ${totalTasks}`);
          console.log(`- Completed: ${completedTasks}`);
          console.log(`- In Progress: ${inProgressTasks}`);
          console.log(`- Blocked: ${blockedTasks}`);
          console.log(
            `- Completion Rate: ${totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0}%`
          );
          console.log(`- Health: ${project.health || "Unknown"}`);
        }
      }
    } else {
      console.log("⚠️ No users found in database");
    }
  } catch (error) {
    console.error("❌ Database error:", error.message);
    console.error("Error code:", error.code);
    if (error.code === "P1001") {
      console.error(
        "Cannot connect to the database. Check your DATABASE_URL in .env"
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
console.log("Starting agent tools test...\n");
testDatabase().catch(console.error);

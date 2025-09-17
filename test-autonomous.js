/**
 * Test script for the autonomous agent
 * Run with: node test-autonomous.js
 */

async function testAutonomousAgent() {
  const baseUrl = "http://localhost:3000/api/agent/autonomous";

  // Test cases
  const tests = [
    {
      name: "Get all projects",
      message: "Show me all projects in the system",
    },
    {
      name: "Get users",
      message: "List all users and their roles",
    },
    {
      name: "Create a project",
      message:
        "Create a new project for TechStart Inc for a mobile app development starting next Monday",
    },
    {
      name: "Complex query",
      message:
        "Find all active projects and show me which ones have overdue tasks",
    },
    {
      name: "Update operation",
      message:
        "Find the most recent project and add a note saying 'Reviewed by AI assistant'",
    },
  ];

  console.log("🤖 Testing Autonomous Agent\n");

  for (const test of tests) {
    console.log(`\n📝 Test: ${test.name}`);
    console.log(`Message: "${test.message}"`);

    try {
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: test.message,
          userId: "test-user",
          createNewThread: test === tests[0], // Create new thread for first test
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("✅ Success!");
        console.log("Response:", data.response?.substring(0, 200) + "...");
        console.log("Conversation ID:", data.conversationId);
        console.log("Thread ID:", data.threadId);
      } else {
        console.log("❌ Error:", data.error);
      }
    } catch (error) {
      console.log("❌ Request failed:", error.message);
    }

    // Wait between tests
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log("\n✨ Tests complete!");
}

// Run the tests
testAutonomousAgent().catch(console.error);

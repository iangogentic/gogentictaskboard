// Test the agent API directly to verify it works
const fetch = require("node-fetch");

async function testAgentAPI() {
  const baseUrl = "http://localhost:3002";

  console.log("Testing Agent Chat API...\n");

  // Test cases
  const testCases = [
    {
      name: "Analyze project health (no projectId)",
      message: "analyze project health",
      projectId: undefined,
    },
    {
      name: "Analyze specific project",
      message: "analyze project health",
      projectId: "cmfekt8gq0008d0jczs9lbtso",
    },
    {
      name: "List tasks",
      message: "list all tasks",
      projectId: undefined,
    },
    {
      name: "Greeting",
      message: "hello",
      projectId: undefined,
    },
  ];

  for (const test of testCases) {
    console.log(`\n📝 Test: ${test.name}`);
    console.log(`   Message: "${test.message}"`);
    console.log(`   ProjectId: ${test.projectId || "none"}`);

    try {
      const body = {
        message: test.message,
      };

      if (test.projectId) {
        body.projectId = test.projectId;
      }

      const response = await fetch(`${baseUrl}/api/agent/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Note: In real usage, would need auth cookies
        },
        body: JSON.stringify(body),
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);

      const data = await response.text();

      if (response.ok) {
        const json = JSON.parse(data);
        console.log(`   ✅ Response: ${json.response?.substring(0, 100)}...`);
        if (json.conversationId) {
          console.log(`   ConversationId: ${json.conversationId}`);
        }
      } else {
        console.log(`   ❌ Error: ${data.substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }

  console.log("\n✅ Test complete!");
}

// Note: This test requires authentication to work properly
console.log("⚠️  Note: This test requires being logged in to work properly.");
console.log("   Without authentication, it will redirect to login page.\n");

testAgentAPI().catch(console.error);

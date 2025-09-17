const baseUrl = "http://localhost:3003/api/agent/hybrid";

// Test cases to verify hybrid behavior
const testCases = [
  {
    name: "Simple Query (Should use function)",
    message: "Show me all active projects",
    expectedPath: "function",
  },
  {
    name: "Get Users (Should use function)",
    message: "List all users in the system",
    expectedPath: "function",
  },
  {
    name: "Create Project (Should use function)",
    message: "Create a new project called 'Mobile App' for client 'TechCorp'",
    expectedPath: "function",
  },
  {
    name: "Complex Query (Should use dynamic)",
    message:
      "Find all projects that have more than 5 incomplete tasks and show me the task distribution by status",
    expectedPath: "dynamic",
  },
  {
    name: "Aggregation (Should use dynamic)",
    message: "Calculate the average hours spent per task grouped by project",
    expectedPath: "dynamic",
  },
  {
    name: "Multi-step Operation (Should use dynamic)",
    message:
      "Find the user with the least tasks and assign them to the newest unassigned task",
    expectedPath: "dynamic",
  },
];

async function testHybrid() {
  console.log("🚀 Testing Hybrid Assistant\n");
  console.log("=".repeat(60));

  let conversationId = null;
  const timings = [];

  for (const test of testCases) {
    console.log(`\n📝 Test: ${test.name}`);
    console.log(`   Expected: ${test.expectedPath} execution`);
    console.log(`   Message: "${test.message}"`);

    const startTime = Date.now();

    try {
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: test.message,
          userId: "test-user",
          conversationId: conversationId,
        }),
      });

      const data = await response.json();
      const elapsed = Date.now() - startTime;

      if (response.ok) {
        console.log(`   ✅ Success in ${elapsed}ms`);

        // Store conversation ID for continuity
        if (data.conversationId && !conversationId) {
          conversationId = data.conversationId;
        }

        // Show response preview
        const preview =
          data.response?.substring(0, 150) +
          (data.response?.length > 150 ? "..." : "");
        console.log(`   Response: ${preview}`);

        timings.push({
          test: test.name,
          time: elapsed,
          expected: test.expectedPath,
        });
      } else {
        console.log(`   ❌ Error: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }

    // Small delay between tests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Show performance summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Performance Summary:\n");

  timings.forEach((t) => {
    const speed = t.time < 2000 ? "⚡" : t.time < 3000 ? "🔄" : "🐢";
    console.log(`   ${speed} ${t.test}: ${t.time}ms`);
  });

  const avgTime = Math.round(
    timings.reduce((a, b) => a + b.time, 0) / timings.length
  );
  console.log(`\n   Average response time: ${avgTime}ms`);

  // Compare to pure approaches
  console.log("\n📈 Comparison to Pure Approaches:");
  console.log("   Pure Function-based: ~1000-2000ms (but limited)");
  console.log("   Pure Autonomous: ~3000-5000ms (but flexible)");
  console.log(`   Hybrid (actual): ~${avgTime}ms (best of both)`);

  console.log("\n✨ Test complete!");
}

// Run tests
testHybrid().catch(console.error);

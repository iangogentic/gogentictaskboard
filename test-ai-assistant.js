const fetch = require("node-fetch");

async function testAIAssistant() {
  console.log("Testing AI Assistant with direct database access...\n");

  const testQueries = [
    "List all projects on the site",
    "What is the overview of the site?",
    "Show me active tasks",
    "Search for recent project updates",
  ];

  for (const query of testQueries) {
    console.log(`\n📝 Query: "${query}"`);
    console.log("-".repeat(50));

    try {
      const response = await fetch("http://localhost:3003/api/agent/chat-v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: query,
          projectId: null,
          history: [],
        }),
      });

      if (!response.ok) {
        console.error(`❌ Error: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.error(`Response: ${text}`);
        continue;
      }

      const data = await response.json();
      console.log(`✅ Response received`);
      console.log(`Function Called: ${data.functionCalled ? "Yes" : "No"}`);
      console.log(`\nAI Response:\n${data.response}`);
    } catch (error) {
      console.error(`❌ Network Error: ${error.message}`);
    }
  }
}

// Check if node-fetch is installed
try {
  require.resolve("node-fetch");
  testAIAssistant();
} catch (e) {
  console.log("Installing node-fetch...");
  require("child_process").execSync(
    "cd gogentic-portal-production && npm install node-fetch@2",
    { stdio: "inherit" }
  );
  console.log("Please run the script again.");
}

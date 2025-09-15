// Test script for GPT-5 Agent
const fetch = require("node-fetch");

async function testAgent() {
  const messages = [
    "yo",
    "hey what's up",
    "what projects do we have",
    "show my tasks",
    "what can you do",
  ];

  console.log("🚀 Testing GPT-5 Agent on localhost:3002\n");
  console.log("=====================================\n");

  for (const message of messages) {
    console.log(`📝 Testing: "${message}"`);

    try {
      const response = await fetch("http://localhost:3002/api/agent/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          projectId: null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`✅ Response from ${data.model || "unknown model"}:`);
        console.log(`   ${data.response}\n`);
        if (data.apiKeyDetected) {
          console.log(`   🔑 API Key detected: Yes`);
        }
        if (data.fallback) {
          console.log(`   ⚠️  Fallback used: ${data.model}`);
        }
        console.log(
          `   📊 Tools used: ${data.toolsUsed?.join(", ") || "none"}`
        );
      } else {
        console.log(`❌ Error: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }

    console.log("-------------------------------------\n");
  }
}

testAgent().catch(console.error);

// Test local API endpoints for integrations
const http = require("http");

const BASE_URL = "http://localhost:3002";

function makeRequest(path, method = "GET") {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on("error", reject);
    req.end();
  });
}

async function testEndpoints() {
  console.log("Testing Local API Endpoints");
  console.log("===========================\n");

  // 1. Health check
  console.log("1. Testing /api/health...");
  try {
    const health = await makeRequest("/api/health");
    console.log(`   Status: ${health.status}`);
    if (health.status === 200) {
      console.log("   ✅ API is healthy");
    } else if (health.status === 307) {
      console.log("   ⚠️  Redirected to login (auth required)");
    }
  } catch (error) {
    console.log("   ❌ Failed:", error.message);
  }

  // 2. Slack test
  console.log("\n2. Testing /api/slack/test...");
  try {
    const slack = await makeRequest("/api/slack/test");
    console.log(`   Status: ${slack.status}`);
    if (slack.status === 401) {
      console.log("   ⚠️  Requires authentication");
    } else if (slack.status === 200) {
      const data = JSON.parse(slack.body);
      console.log("   Response:", data);
    }
  } catch (error) {
    console.log("   ❌ Failed:", error.message);
  }

  // 3. Google test
  console.log("\n3. Testing /api/google/test...");
  try {
    const google = await makeRequest("/api/google/test");
    console.log(`   Status: ${google.status}`);
    if (google.status === 401) {
      console.log("   ⚠️  Requires authentication");
    } else if (google.status === 200) {
      const data = JSON.parse(google.body);
      console.log("   Response:", data);
    }
  } catch (error) {
    console.log("   ❌ Failed:", error.message);
  }

  // 4. Slack channels (no auth version)
  console.log("\n4. Testing /api/slack/channels...");
  try {
    const channels = await makeRequest("/api/slack/channels");
    console.log(`   Status: ${channels.status}`);
    if (channels.status === 401) {
      console.log("   ⚠️  Requires authentication");
    } else if (channels.status === 200) {
      const data = JSON.parse(channels.body);
      console.log("   Response:", data);
    }
  } catch (error) {
    console.log("   ❌ Failed:", error.message);
  }

  console.log("\n===========================");
  console.log("Summary:");
  console.log("- Server is running on port 3002");
  console.log("- API endpoints require authentication");
  console.log("- Need to login via browser to test fully");
  console.log("\nNext steps:");
  console.log("1. Open http://localhost:3002 in browser");
  console.log("2. Login with Google OAuth");
  console.log("3. Test integration features in UI");
}

testEndpoints();

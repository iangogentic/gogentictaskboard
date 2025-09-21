const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Navigating to login page...");
  await page.goto("http://localhost:3002/login");
  await page.waitForLoadState("networkidle");

  // Take screenshot of login page
  await page.screenshot({ path: "screenshots/01-login.png", fullPage: true });
  console.log("Screenshot saved: login page");

  // Fill in credentials
  console.log("Filling in credentials...");
  await page.fill('input[name="email"]', "claude.test@gogentic.ai");
  await page.fill('input[name="password"]', "claude-test-2025");

  // Click sign in button
  console.log("Clicking sign in...");
  await page.click('button[type="submit"]');

  // Wait for navigation after login
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(3000);

  console.log("Current URL after login:", page.url());

  // Take screenshot after login
  await page.screenshot({
    path: "screenshots/02-after-login.png",
    fullPage: true,
  });

  // Check console for errors
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log("Console error:", msg.text());
    }
  });

  // Navigate to each page and take screenshots
  const pages = [
    { url: "/glass-home", name: "03-glass-home" },
    { url: "/dashboard", name: "04-dashboard" },
    { url: "/projects", name: "05-projects" },
    { url: "/activity", name: "06-activity" },
    { url: "/my-work", name: "07-my-work" },
    { url: "/team", name: "08-team" },
    { url: "/reports", name: "09-reports" },
  ];

  for (const pageInfo of pages) {
    try {
      console.log(`\nNavigating to ${pageInfo.url}...`);
      await page.goto(`http://localhost:3002${pageInfo.url}`, {
        waitUntil: "networkidle",
      });
      await page.waitForTimeout(2000);

      console.log(`Current URL: ${page.url()}`);

      // Check for GlassTopBar
      const hasTopBar = (await page.locator(".sticky.top-0").count()) > 0;
      console.log(`GlassTopBar present: ${hasTopBar}`);

      // Take screenshot
      await page.screenshot({
        path: `screenshots/${pageInfo.name}.png`,
        fullPage: true,
      });
      console.log(`Screenshot saved: ${pageInfo.name}`);
    } catch (error) {
      console.log(`Error on ${pageInfo.url}:`, error.message);
    }
  }

  console.log("\n=== Analysis Complete ===");

  await browser.close();
})();

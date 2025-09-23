import { config as loadEnv } from "dotenv";
import path from "path";
import os from "os";
loadEnv({ path: process.env.MCP_ENV_PATH ?? undefined });
function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
export const env = {
  baseUrl: process.env.GOGENTIC_BASE_URL ?? "http://localhost:3002",
  oauthRedirectPort: parseInt(
    process.env.MCP_OAUTH_REDIRECT_PORT ?? "5300",
    10
  ),
  serverPort: parseInt(process.env.MCP_SERVER_PORT ?? "5310", 10),
  googleClientId: requireEnv("GOOGLE_CLIENT_ID"),
  googleClientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
  tokenStorePath:
    process.env.MCP_TOKEN_STORE ??
    path.join(os.homedir(), ".gogentic", "mcp-session.json"),
};

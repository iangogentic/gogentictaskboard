import fs from "fs";
import path from "path";
import { env } from "./config";

export interface StoredUser {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
}

export interface StoredSession {
  mcpToken: string;
  tokenExpiresAt: string; // ISO string
  googleRefreshToken?: string;
  googleExpiry?: string;
  user: StoredUser;
}

export class TokenStore {
  private readonly storePath: string;

  constructor(storePath: string = env.tokenStorePath) {
    this.storePath = storePath;
  }

  load(): StoredSession | null {
    try {
      if (!fs.existsSync(this.storePath)) {
        return null;
      }
      const raw = fs.readFileSync(this.storePath, "utf-8");
      const data = JSON.parse(raw) as StoredSession;
      return data;
    } catch (error) {
      console.warn("Failed to load MCP session store", error);
      return null;
    }
  }

  save(session: StoredSession) {
    const dir = path.dirname(this.storePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.storePath, JSON.stringify(session, null, 2), "utf-8");
  }

  clear() {
    try {
      if (fs.existsSync(this.storePath)) {
        fs.unlinkSync(this.storePath);
      }
    } catch (error) {
      console.warn("Failed to clear MCP session store", error);
    }
  }
}

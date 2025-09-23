import fs from "fs";
import path from "path";
import { env } from "./config";
export class TokenStore {
  constructor(storePath = env.tokenStorePath) {
    this.storePath = storePath;
  }
  load() {
    try {
      if (!fs.existsSync(this.storePath)) {
        return null;
      }
      const raw = fs.readFileSync(this.storePath, "utf-8");
      const data = JSON.parse(raw);
      return data;
    } catch (error) {
      console.warn("Failed to load MCP session store", error);
      return null;
    }
  }
  save(session) {
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

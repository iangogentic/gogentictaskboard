import express from "express";
import { Issuer, Client, generators, TokenSet } from "openid-client";
import open from "open";
import axios from "axios";
import { env } from "./config";
import { TokenStore, StoredSession } from "./tokenStore";

interface ExchangeResponse {
  token: string;
  expiresAt: string;
  user: {
    id: string;
    email: string;
    name?: string | null;
    role?: string | null;
  };
}

export class OAuthManager {
  private clientPromise: Promise<Client> | null = null;
  private readonly tokenStore = new TokenStore();

  async ensureSession(): Promise<StoredSession> {
    const existing = this.tokenStore.load();
    if (
      existing &&
      new Date(existing.tokenExpiresAt) > new Date(Date.now() + 60_000)
    ) {
      return existing;
    }
    return await this.startFlow();
  }

  async disconnect(): Promise<void> {
    this.tokenStore.clear();
  }

  private async getClient(): Promise<Client> {
    if (!this.clientPromise) {
      const issuer = await Issuer.discover("https://accounts.google.com");
      this.clientPromise = Promise.resolve(
        new issuer.Client({
          client_id: env.googleClientId,
          client_secret: env.googleClientSecret,
          redirect_uris: [this.redirectUri],
          response_types: ["code"],
        })
      );
    }
    return this.clientPromise;
  }

  private get redirectUri(): string {
    return `http://localhost:${env.oauthRedirectPort}/oauth/google/callback`;
  }

  private async startFlow(): Promise<StoredSession> {
    const app = express();
    const server = app.listen(env.oauthRedirectPort);

    const client = await this.getClient();
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);

    const authUrl = client.authorizationUrl({
      scope: "openid profile email",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      access_type: "offline",
      prompt: "consent",
    });

    await open(authUrl);

    const tokens = await new Promise<TokenSet>((resolve, reject) => {
      const cleanup = () => {
        server.close();
      };

      app.get("/oauth/google/callback", async (req, res) => {
        try {
          const params = client.callbackParams(req);
          const tokenSet = await client.callback(this.redirectUri, params, {
            code_verifier: codeVerifier,
          });
          res.send(
            "Google authentication successful. You can close this window and return to your IDE."
          );
          resolve(tokenSet);
        } catch (error: any) {
          console.error("OAuth callback error", error);
          res.status(500).send("OAuth flow failed. Check the MCP server logs.");
          reject(error);
        } finally {
          cleanup();
        }
      });

      app.get("/health", (_req, res) => res.json({ ok: true }));

      server.on("error", (err) => {
        cleanup();
        reject(err);
      });
    });

    if (!tokens.id_token) {
      throw new Error("Google token set missing id_token");
    }

    const exchange = await this.exchangeWithNext(tokens.id_token);

    const session: StoredSession = {
      mcpToken: exchange.token,
      tokenExpiresAt: exchange.expiresAt,
      googleRefreshToken: tokens.refresh_token ?? undefined,
      googleExpiry: tokens.expires_at
        ? new Date(tokens.expires_at * 1000).toISOString()
        : undefined,
      user: exchange.user,
    };

    this.tokenStore.save(session);
    return session;
  }

  private async exchangeWithNext(idToken: string): Promise<ExchangeResponse> {
    const response = await axios.post<ExchangeResponse>(
      `${env.baseUrl}/api/mcp/auth`,
      {
        idToken,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    return response.data;
  }
}

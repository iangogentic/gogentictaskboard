import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const client = new OAuth2Client();
const TOKEN_TTL_SECONDS = 60 * 60; // 1 hour

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const idToken = body?.idToken as string | undefined;

    if (!idToken) {
      return NextResponse.json({ error: "idToken is required" }, { status: 400 });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID,
    });
    const payload = ticket.getPayload();

    if (!payload?.email || !payload.sub) {
      return NextResponse.json({ error: "Invalid Google token" }, { status: 400 });
    }

    const email = payload.email.toLowerCase();

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: payload.name ?? email,
          image: payload.picture,
          emailVerified: new Date(),
        },
      });
    }

    const secret = process.env.MCP_JWT_SECRET;
    if (!secret) {
      throw new Error("MCP_JWT_SECRET is not configured on the server");
    }

    const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000);

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      secret,
      { expiresIn: TOKEN_TTL_SECONDS }
    );

    return NextResponse.json({
      token,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("MCP auth error", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to authenticate" },
      { status: 500 }
    );
  }
}

import { getIronSession } from "iron-session";
import type { NextApiRequest, NextApiResponse } from "next";

export interface SessionData {
  userId?: string;
}

// Require SESSION_SECRET in production, fail fast if missing
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error("SESSION_SECRET environment variable is required in production");
  }
  console.warn("Warning: Using fallback SESSION_SECRET for development. Set SESSION_SECRET environment variable.");
}

const sessionOptions = {
  password: SESSION_SECRET || "fallback-secret-for-development-only",
  cookieName: "session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    sameSite: process.env.NODE_ENV === "production" ? "lax" as const : "lax" as const,
  },
};

export async function getSession(req: any, res: any) {
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  return session;
}

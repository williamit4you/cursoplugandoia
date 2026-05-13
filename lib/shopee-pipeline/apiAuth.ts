import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function hasAdminSession(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return false;
  const token = await getToken({ req, secret }).catch(() => null);
  return Boolean(token);
}

export async function requireAdminOrCronSecret(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && secret === cronSecret) return;
  if (await hasAdminSession(req)) return;

  throw new Error("Unauthorized");
}

import { NextResponse } from "next/server";
import { requireServerSession } from "@/lib/serverAuth";

export async function requireLimpezaVideoSession() {
  const session = await requireServerSession();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!session || !session.user || !userId) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true as const, session, userId };
}

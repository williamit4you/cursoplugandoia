import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = ctx.params.id;
    const body = await req.json();
    const data: any = {};

    if (body?.questionText != null) data.questionText = String(body.questionText);
    if (body?.status != null) data.status = String(body.status);
    if (body?.errorMessage !== undefined) data.errorMessage = body.errorMessage ? String(body.errorMessage) : null;
    if (body?.startedAt !== undefined) data.startedAt = body.startedAt ? new Date(body.startedAt) : null;
    if (body?.completedAt !== undefined) data.completedAt = body.completedAt ? new Date(body.completedAt) : null;
    if (body?.codeVideoProjectId !== undefined) data.codeVideoProjectId = body.codeVideoProjectId ? String(body.codeVideoProjectId) : null;

    const updated = await prisma.videoQuestion.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[api/video-questions/[id] PATCH]", error);
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = ctx.params.id;
    await prisma.videoQuestion.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/video-questions/[id] DELETE]", error);
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    
    // Build update payload
    const updateData: any = {};
    if (body.scheduledTo !== undefined) {
      updateData.scheduledTo = body.scheduledTo ? new Date(body.scheduledTo) : null;
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
    }
    if (body.summary !== undefined) {
      updateData.summary = body.summary;
    }

    const updated = await prisma.socialPost.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[api/social/posts/[id] PATCH]", error);
    return NextResponse.json({ error: error.message || "Failed to update social post" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await prisma.socialPost.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[api/social/posts/[id] DELETE]", error);
    return NextResponse.json({ error: error.message || "Failed to delete social post" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminOrCronSecret(req);
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
    if (body.platform !== undefined) {
      updateData.platform = String(body.platform || "").trim();
    }
    if (body.postType !== undefined) {
      updateData.postType = String(body.postType || "").trim();
    }
    if (body.videoUrl !== undefined) {
      updateData.videoUrl = String(body.videoUrl || "").trim();
    }

    // Quando o usuário re-agenda/republica, limpar campos de publicação anteriores.
    if (body.resetPublication === true) {
      updateData.postedAt = null;
      updateData.postUrl = null;
      updateData.youtubePostedAt = null;
      updateData.youtubePostUrl = null;
      updateData.metaStoryPostedAt = null;
      updateData.metaStoryPostUrl = null;
      updateData.metaReelPostedAt = null;
      updateData.metaReelPostUrl = null;
      updateData.tiktokPostedAt = null;
      updateData.tiktokPostUrl = null;
      updateData.linkedinPostedAt = null;
      updateData.linkedinPostUrl = null;
      updateData.metaContainerId = null;
    }

    const updated = await prisma.socialPost.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[api/social/posts/[id] PATCH]", error);
    const status = error?.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: error.message || "Failed to update social post" }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminOrCronSecret(req);
    const { id } = params;
    await prisma.socialPost.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[api/social/posts/[id] DELETE]", error);
    const status = error?.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: error.message || "Failed to delete social post" }, { status });
  }
}

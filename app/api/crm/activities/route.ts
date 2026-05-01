import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireServerSession } from "@/lib/serverAuth";

export async function POST(req: NextRequest) {
  const session = await requireServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const activity = await prisma.crmActivity.create({
      data: {
        contactId: body.contactId,
        type: body.type,
        direction: body.direction || "INTERNAL",
        subject: body.subject || null,
        content: body.content,
        happenedAt: body.happenedAt ? new Date(body.happenedAt) : new Date(),
        authorUserId: (session.user as any).id,
        metadataJson: body.metadataJson || "{}",
      },
    });

    await prisma.crmContact.update({
      where: { id: body.contactId },
      data: { lastContactAt: new Date() },
    });

    return NextResponse.json(activity);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
  }
}

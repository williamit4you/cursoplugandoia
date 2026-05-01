import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireServerSession } from "@/lib/serverAuth";

export async function GET(
  req: Request,
  { params }: { params: { contactId: string } }
) {
  const session = await requireServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const conversation = await prisma.crmConversation.findFirst({
      where: { contactId: params.contactId },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 50,
        },
      },
    });

    return NextResponse.json(conversation);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load conversation" }, { status: 500 });
  }
}

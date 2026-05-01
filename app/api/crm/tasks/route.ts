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

    const task = await prisma.crmTask.create({
      data: {
        contactId: body.contactId,
        title: body.title,
        description: body.description || null,
        status: body.status || "OPEN",
        dueAt: body.dueAt ? new Date(body.dueAt) : null,
        assignedToUserId: body.assignedToUserId || (session.user as any).id,
      },
    });

    await prisma.crmActivity.create({
      data: {
        contactId: body.contactId,
        type: "TASK",
        direction: "INTERNAL",
        subject: "Nova tarefa",
        content: `Tarefa criada: ${body.title}`,
        authorUserId: (session.user as any).id,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

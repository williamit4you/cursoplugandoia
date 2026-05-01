import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/crm";
import { requireServerSession } from "@/lib/serverAuth";

export async function GET() {
  const session = await requireServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contacts = await prisma.crmContact.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        activities: {
          orderBy: { happenedAt: "desc" },
          take: 5,
        },
        tasks: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    return NextResponse.json(contacts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load contacts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const phone = normalizePhone(body.phone || "");

    if (!phone) {
      return NextResponse.json({ error: "Phone is required" }, { status: 400 });
    }

    const contact = await prisma.crmContact.upsert({
      where: { phone },
      update: {
        name: body.name || undefined,
        email: body.email || undefined,
        company: body.company || undefined,
        source: body.source || undefined,
        interestService: body.interestService || undefined,
        notes: body.notes || undefined,
        stage: body.stage || undefined,
        ownerUserId: (session.user as any).id,
      },
      create: {
        name: body.name || null,
        phone,
        email: body.email || null,
        company: body.company || null,
        source: body.source || "site",
        interestService: body.interestService || null,
        notes: body.notes || null,
        stage: body.stage || "LEAD",
        ownerUserId: (session.user as any).id,
      },
    });

    await prisma.crmActivity.create({
      data: {
        contactId: contact.id,
        type: "SYSTEM",
        direction: "INTERNAL",
        subject: "Contato criado/atualizado",
        content: `Contato salvo via CRM com interesse em ${body.interestService || "serviços gerais"}.`,
        authorUserId: (session.user as any).id,
      },
    });

    return NextResponse.json(contact);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Phone or email already exists" }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to save contact" }, { status: 500 });
  }
}

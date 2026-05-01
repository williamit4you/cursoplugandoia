import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/crm";
import { requireServerSession } from "@/lib/serverAuth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const current = await prisma.crmContact.findUnique({ where: { id: params.id } });

    if (!current) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const updated = await prisma.crmContact.update({
      where: { id: params.id },
      data: {
        name: body.name ?? current.name,
        phone: body.phone ? normalizePhone(body.phone) : current.phone,
        email: body.email ?? current.email,
        company: body.company ?? current.company,
        source: body.source ?? current.source,
        interestService: body.interestService ?? current.interestService,
        notes: body.notes ?? current.notes,
        stage: body.stage ?? current.stage,
        lastContactAt: body.lastContactAt ? new Date(body.lastContactAt) : current.lastContactAt,
        ownerUserId: body.ownerUserId ?? current.ownerUserId,
      },
    });

    if (body.stage && body.stage !== current.stage) {
      await prisma.crmActivity.create({
        data: {
          contactId: updated.id,
          type: "SYSTEM",
          direction: "INTERNAL",
          subject: "Mudança de etapa",
          content: `Contato movido de ${current.stage} para ${body.stage}.`,
          authorUserId: (session.user as any).id,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Phone or email already exists" }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
  }
}

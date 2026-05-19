import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function serializeColeta(item: any) {
  return {
    ...item,
    aiPromptVendas: item?.aiPromptEngajamento ?? item?.aiPromptVendas ?? null,
  };
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const current = await prisma.coletaDadosShoppe.findFirst({
      where: { id: params.id, pipelineKind: "ENGAGEMENT" as any },
      select: { id: true },
    });
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.coletaDadosShoppe.delete({ where: { id: current.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const current = await prisma.coletaDadosShoppe.findFirst({
      where: { id: params.id, pipelineKind: "ENGAGEMENT" as any },
      select: { id: true },
    });
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const aiPromptEngajamento = body.aiPromptEngajamento ?? body.aiPromptVendas;
    const { titulo, descricao, detalhes } = body;

    const updated = await prisma.coletaDadosShoppe.update({
      where: { id: current.id },
      data: {
        ...(titulo !== undefined && { titulo }),
        ...(descricao !== undefined && { descricao }),
        ...(detalhes !== undefined && { detalhes }),
        ...(aiPromptEngajamento !== undefined && { aiPromptEngajamento }),
      },
      include: { linksMedia: true },
    });
    return NextResponse.json(serializeColeta(updated));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const coleta = await prisma.coletaDadosShoppe.findFirst({
      where: { id: params.id, pipelineKind: "ENGAGEMENT" as any },
      include: { linksMedia: true },
    });
    if (!coleta) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(serializeColeta(coleta));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

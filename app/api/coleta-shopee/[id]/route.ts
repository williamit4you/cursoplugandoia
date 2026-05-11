import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.coletaDadosShoppe.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { titulo, descricao, detalhes, aiPromptVendas } = body;
    const updated = await prisma.coletaDadosShoppe.update({
      where: { id: params.id },
      data: {
        ...(titulo !== undefined && { titulo }),
        ...(descricao !== undefined && { descricao }),
        ...(detalhes !== undefined && { detalhes }),
        ...(aiPromptVendas !== undefined && { aiPromptVendas }),
      },
      include: { linksMedia: true },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const coleta = await prisma.coletaDadosShoppe.findUnique({
      where: { id: params.id },
      include: { linksMedia: true },
    });
    if (!coleta) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(coleta);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

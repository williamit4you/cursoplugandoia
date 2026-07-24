import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const coletas = await prisma.coletaDadosShoppe.findMany({
      orderBy: { createdAt: "desc" },
      where: { pipelineKind: "SALES" as any },
      include: { linksMedia: true }
    });
    return NextResponse.json(coletas);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url, creatorPersonaId } = body;
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const dataObj: any = { url, pipelineKind: "SALES" as any };
    if (creatorPersonaId) {
      dataObj.creatorPersonaId = creatorPersonaId;
    }

    const coleta = await prisma.coletaDadosShoppe.create({
      data: dataObj
    });

    return NextResponse.json(coleta);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "URL already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

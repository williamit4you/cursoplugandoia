import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const coletas = await prisma.coletaDadosShoppe.findMany({
      orderBy: { createdAt: "desc" },
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
    const { url } = body;
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const coleta = await prisma.coletaDadosShoppe.create({
      data: { url }
    });

    return NextResponse.json(coleta);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "URL already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

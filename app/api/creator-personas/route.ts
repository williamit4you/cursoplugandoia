import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const personas = await prisma.creatorPersona.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(personas);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, imageUrl, voiceRefUrl } = await req.json();

    if (!name || !imageUrl) {
      return NextResponse.json({ error: "Nome e Imagem são obrigatórios" }, { status: 400 });
    }

    const persona = await prisma.creatorPersona.create({
      data: {
        name,
        imageUrl,
        voiceRefUrl: voiceRefUrl || null,
        active: true,
      },
    });

    return NextResponse.json(persona);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

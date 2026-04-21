import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const post = await prisma.post.update({
      where: { id: params.id },
      data: { views: { increment: 1 } },
    });
    return NextResponse.json({ success: true, views: post.views });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Falha ao computar visualização." }, { status: 500 });
  }
}

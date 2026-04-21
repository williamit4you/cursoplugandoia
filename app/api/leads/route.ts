import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function POST(req: NextRequest) {
  try {
    const { email, name, source } = await req.json();

    const lead = await prisma.lead.upsert({
      where: { email },
      update: { name, source },
      create: { email, name, source },
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Falha registrar Lead" }, { status: 500 });
  }
}

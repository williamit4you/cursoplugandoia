import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, summary, content, status, slug } = body;

    const post = await prisma.post.create({
      data: {
        title,
        summary,
        content,
        status,
        slug,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("Create Post error:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}

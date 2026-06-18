import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function baseUrl(req: NextRequest) {
  const host = req.headers.get("host") || "localhost:3000";
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const protocol = forwardedProto || (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

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

    fetch(`${baseUrl(req)}/api/posts/${post.id}/generate-video`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trigger: "post_create" }),
      cache: "no-store",
    }).catch((err) => console.error("[create post -> auto video]", err));

    return NextResponse.json(post);
  } catch (error) {
    console.error("Create Post error:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}

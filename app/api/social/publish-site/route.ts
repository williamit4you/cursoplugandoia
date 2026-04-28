import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

export const dynamic = "force-dynamic";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80) || "noticia";
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function extractYouTubeId(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace("/", "").trim() || null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      const embedIdx = parts.indexOf("embed");
      if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * POST /api/social/publish-site
 * Cria um Post em /noticias e vincula no SocialPost (postId).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const socialPostId = String(body?.socialPostId ?? "").trim();
    const publishNow = body?.publishNow !== false; // default true

    if (!socialPostId) {
      return NextResponse.json({ error: "socialPostId is required" }, { status: 400 });
    }

    const socialPost = await prisma.socialPost.findUnique({
      where: { id: socialPostId },
      include: { post: true },
    });
    if (!socialPost) {
      return NextResponse.json({ error: "Post social não encontrado" }, { status: 404 });
    }

    if (socialPost.postId && socialPost.post) {
      return NextResponse.json({ success: true, postId: socialPost.postId, slug: socialPost.post.slug });
    }

    const titleBase = (socialPost.summary || "").trim().slice(0, 110) || "Nova notícia";
    const summary = (socialPost.summary || "").trim().slice(0, 240) || titleBase;

    const sourceUrl = socialPost.postUrl || null;
    if (sourceUrl) {
      const existingBySource = await prisma.post.findFirst({ where: { sourceUrl } });
      if (existingBySource) {
        await prisma.socialPost.update({
          where: { id: socialPostId },
          data: { postId: existingBySource.id },
        });
        return NextResponse.json({ success: true, postId: existingBySource.id, slug: existingBySource.slug });
      }
    }

    let slug = slugify(titleBase);
    for (let i = 0; i < 50; i++) {
      const exists = await prisma.post.findUnique({ where: { slug } });
      if (!exists) break;
      slug = `${slugify(titleBase)}-${i + 2}`;
    }

    const videoId = socialPost.postUrl ? extractYouTubeId(socialPost.postUrl) : null;
    const embedHtml = videoId
      ? `
        <div style="margin-top: 32px">
          <h2>Vídeo</h2>
          <div style="position: relative; width: 100%; padding-top: 56.25%; border-radius: 12px; overflow: hidden; background: #0b1220;">
            <iframe
              src="https://www.youtube.com/embed/${videoId}"
              title="YouTube video player"
              style="position:absolute; inset:0; width:100%; height:100%; border:0;"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
            ></iframe>
          </div>
        </div>
      `
      : "";

    const content = `
      <p>${escapeHtml(socialPost.summary || "")}</p>
      ${socialPost.postUrl ? `<p><a href="${escapeHtml(socialPost.postUrl)}" target="_blank" rel="noreferrer">Abrir no YouTube</a></p>` : ""}
      ${embedHtml}
    `.trim();

    const created = await prisma.post.create({
      data: {
        title: titleBase,
        slug,
        summary,
        content,
        status: publishNow ? "PUBLISHED" : "DRAFT",
        sourceUrl,
      },
    });

    const logEntry = `[${new Date().toLocaleTimeString("pt-BR")}] 📰 Publicado no site: /noticias/${created.slug}`;
    await prisma.socialPost.update({
      where: { id: socialPostId },
      data: {
        postId: created.id,
        log: socialPost.log ? `${socialPost.log}\n${logEntry}` : logEntry,
      },
    });

    return NextResponse.json({ success: true, postId: created.id, slug: created.slug });
  } catch (error: any) {
    console.error("[api/social/publish-site POST]", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao publicar no site" },
      { status: 500 }
    );
  }
}


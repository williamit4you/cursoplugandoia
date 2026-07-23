import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import ClientSinglePost from "./ClientSinglePost";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await prisma.post.findUnique({ where: { slug: params.slug } });
  
  if (!post || post.status !== "PUBLISHED") {
    return { title: "Notícia Não Encontrada" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://plugandoia.cloud";
  const canonicalUrl = `${siteUrl}/noticias/${post.slug}`;

  return {
    title: `${post.title} | Portal IA`,
    description: post.summary,
    keywords: ["notícias", "tecnologia", "inteligência artificial", "Portal IA"],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      url: canonicalUrl,
      publishedTime: post.createdAt.toISOString(),
      ...(post.coverImage ? { images: [{ url: post.coverImage }] } : {}),
    }
  };
}

export default async function SinglePostView({ params }: { params: { slug: string } }) {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug },
    include: {
      socialPosts: {
        orderBy: { createdAt: "desc" },
        select: {
          platform: true,
          status: true,
          videoUrl: true,
          postUrl: true,
          youtubePostUrl: true,
          metaReelPostUrl: true,
          metaStoryPostUrl: true,
          tiktokPostUrl: true,
          linkedinPostUrl: true,
        },
      },
    },
  });

  if (!post || post.status !== "PUBLISHED") {
    notFound();
  }

  const seoBrief = await prisma.seoBrief.findFirst({
    where: { postId: post.id },
    include: { product: { select: { name: true, productUrl: true, affiliateUrl: true } } },
  }).catch(() => null);

  return <ClientSinglePost post={{ ...post, seoBrief }} />;
}

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

  return {
    title: `${post.title} | Portal IA`,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
    }
  };
}

export default async function SinglePostView({ params }: { params: { slug: string } }) {
  const post = await prisma.post.findUnique({ where: { slug: params.slug } });

  if (!post || post.status !== "PUBLISHED") {
    notFound();
  }

  return <ClientSinglePost post={post} />;
}

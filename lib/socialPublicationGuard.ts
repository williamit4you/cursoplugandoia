import "server-only";

import { createHash } from "crypto";
import { Prisma, PrismaClient } from "@prisma/client";

type PublicationIdentity = {
  platform: string;
  postType: string;
  videoUrl: string;
};

export function buildPublicationKey(input: PublicationIdentity) {
  const canonical = [
    String(input.platform || "").trim().toUpperCase(),
    String(input.postType || "").trim().toUpperCase(),
    String(input.videoUrl || "").trim(),
  ].join("\n");
  return createHash("sha256").update(canonical).digest("hex");
}

export async function appendSocialPostLog(prisma: PrismaClient, id: string, message: string) {
  const current = await prisma.socialPost.findUnique({ where: { id }, select: { log: true } });
  const line = `[${new Date().toLocaleTimeString("pt-BR")}] ${message}`;
  await prisma.socialPost.update({
    where: { id },
    data: { log: current?.log ? `${current.log}\n${line}` : line },
  });
}

export async function reservePublicationIdentity(
  prisma: PrismaClient,
  post: { id: string } & PublicationIdentity
) {
  const publicationKey = buildPublicationKey(post);
  try {
    await prisma.socialPost.update({ where: { id: post.id }, data: { publicationKey } });
    return { allowed: true as const, publicationKey };
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
      throw error;
    }
    const original = await prisma.socialPost.findUnique({
      where: { publicationKey },
      select: { id: true, status: true, postedAt: true },
    });
    await appendSocialPostLog(
      prisma,
      post.id,
      `BLOQUEADO_DUPLICADO: o mesmo video ja pertence ao envio ${original?.id || "desconhecido"} nesta plataforma.`
    );
    await prisma.socialPost.update({ where: { id: post.id }, data: { status: "FAILED" } });
    return { allowed: false as const, publicationKey, original };
  }
}

export async function markSingleAttempt(
  prisma: PrismaClient,
  params: {
    id: string;
    attemptField:
      | "metaContainerAttemptedAt"
      | "metaInstagramPublishAttemptedAt"
      | "metaFacebookPublishAttemptedAt"
      | "tiktokPublishAttemptedAt";
    postedField?: "metaReelPostedAt" | "metaStoryPostedAt" | "tiktokPostedAt";
    message: string;
  }
) {
  const where: Record<string, unknown> = { id: params.id, [params.attemptField]: null };
  if (params.postedField) where[params.postedField] = null;
  const claimed = await prisma.socialPost.updateMany({
    where: where as any,
    data: { [params.attemptField]: new Date(), status: "PUBLISHING" } as any,
  });
  if (claimed.count !== 1) return false;
  await appendSocialPostLog(prisma, params.id, params.message);
  return true;
}

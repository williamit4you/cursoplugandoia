import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCrmSettings } from "@/lib/crmSettings";
import { requireServerSession } from "@/lib/serverAuth";
import { normalizeText, sendWhatsappPromoMessage } from "@/lib/whatsappPromos";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireServerSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const id = normalizeText(params.id);
    const settings = await getOrCreateCrmSettings();
    const post = await prisma.whatsappPromoPost.findUnique({
      where: { id },
      include: { catalogItem: true },
    });
    if (!post) return NextResponse.json({ error: "Postagem nao encontrada." }, { status: 404 });

    const targetId = normalizeText(post.targetId || settings.offersGroupTargetId);
    const delivery = await sendWhatsappPromoMessage({
      targetId,
      messageText: post.bodyText,
      mediaUrl: post.mediaUrl || post.catalogItem.imageUrl,
    });

    const now = new Date();
    const [updated] = await prisma.$transaction([
      prisma.whatsappPromoPost.update({
        where: { id: post.id },
        data: {
          status: "SENT",
          sentAt: now,
          errorMessage: null,
          deliveryPayload: JSON.stringify(delivery || {}),
        },
        include: { catalogItem: true },
      }),
      prisma.whatsappPromoCatalogItem.update({
        where: { id: post.catalogItemId },
        data: { lastPublishedAt: now },
      }),
    ]);

    return NextResponse.json({ post: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Falha ao enviar promocao" }, { status: 500 });
  }
}

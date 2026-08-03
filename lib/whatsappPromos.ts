import "server-only";

import { prisma } from "@/lib/prisma";
import { getCommerceSiteUrl } from "@/lib/siteUrls";
import { getOrCreateCrmSettings } from "@/lib/crmSettings";

export type PromoMessageTemplate = "discount" | "savings" | "daily" | "custom";

export function normalizeText(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function slugify(value: string) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90);
}

export async function ensureUniqueWhatsappPromoSlug(base: string, excludeId?: string | null) {
  const raw = slugify(base) || "promocao-whatsapp";
  let candidate = raw;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const existing = await prisma.whatsappPromoCatalogItem.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${raw}-${attempt + 2}`;
  }
  return `${raw}-${Date.now()}`;
}

export function parsePrice(value: unknown) {
  const raw = normalizeText(value);
  if (!raw) return null;
  const sanitized = raw.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const parsed = Number(sanitized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatPrice(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return null;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function inferOldPrice(currentPrice: number | null | undefined, oldPrice: number | null | undefined) {
  if (oldPrice != null && Number.isFinite(oldPrice) && oldPrice > 0) return Number(oldPrice.toFixed(2));
  if (currentPrice != null && Number.isFinite(currentPrice) && currentPrice > 0) {
    return Number((currentPrice * 1.42).toFixed(2));
  }
  return null;
}

export function computePromoFields(oldPrice: number | null, currentPrice: number | null) {
  if (oldPrice == null || currentPrice == null || oldPrice <= 0 || currentPrice <= 0 || oldPrice <= currentPrice) {
    return { discountPercent: null as number | null, savingsAmount: null as number | null };
  }
  const savingsAmount = Number((oldPrice - currentPrice).toFixed(2));
  const discountPercent = Math.max(1, Math.round(((oldPrice - currentPrice) / oldPrice) * 100));
  return { discountPercent, savingsAmount };
}

export function buildPromoHeadline(title: string, discountPercent: number | null) {
  return normalizeText(title);
}

export function buildPromoShortPhrase(description: string | null | undefined, title?: string | null) {
  const text = normalizeText(description);
  if (text) {
    const sentence = text.split(/(?<=[.!?])\s+/).map(normalizeText).find(Boolean) || text;
    return sentence.slice(0, 90);
  }
  const titleText = normalizeText(title);
  if (!titleText) return "Oferta selecionada para o grupo de promocoes.";
  return `Confira essa oferta em ${titleText.slice(0, 55).toLowerCase()}.`;
}

export function buildInstallmentLine(currentPrice: number | null | undefined) {
  if (currentPrice == null || !Number.isFinite(currentPrice) || currentPrice < 200) return null;
  const installment = Number((currentPrice / 12).toFixed(2));
  const formatted = formatPrice(installment);
  return formatted ? `Em ate 12x ${formatted}` : null;
}

export function buildPromoBody(params: {
  title: string;
  shortPhrase?: string | null;
  oldPrice?: number | null;
  currentPrice?: number | null;
  discountPercent?: number | null;
  savingsAmount?: number | null;
  linkUrl: string;
  template?: PromoMessageTemplate;
}) {
  const title = normalizeText(params.title);
  const safeOldPriceValue = inferOldPrice(params.currentPrice ?? null, params.oldPrice ?? null);
  const oldPrice = formatPrice(safeOldPriceValue);
  const currentPrice = formatPrice(params.currentPrice ?? null);
  const shortPhrase = buildPromoShortPhrase(params.shortPhrase || null, title);
  const installmentLine = buildInstallmentLine(params.currentPrice ?? null);

  const lines = [
    title,
    "",
    shortPhrase,
    "",
    currentPrice ? `Por ${currentPrice}` : null,
    installmentLine,
    oldPrice ? `~Custa ${oldPrice}~` : null,
    "",
    "COMPRE AQUI",
    params.linkUrl,
  ].filter((item) => item !== null) as string[];

  return lines.join("\n");
}

export function buildPromoLink(params: { slug?: string | null; affiliateUrl: string; destination?: string | null }) {
  const destination = normalizeText(params.destination || "BIO_PRODUCT");
  if (destination === "DIRECT_AFFILIATE") return params.affiliateUrl;
  if (params.slug) return `${getCommerceSiteUrl()}/bio/${params.slug}`;
  return `${getCommerceSiteUrl()}/ofertas`;
}

export function isCatalogItemReady(item: {
  category?: string | null;
  affiliateUrl?: string | null;
  currentPrice?: number | null;
  active?: boolean | null;
}) {
  // Categoria ajuda na organização do catálogo, mas não deve bloquear uma oferta
  // legítima de ser publicada.
  return Boolean(item.active !== false && normalizeText(item.affiliateUrl) && item.currentPrice != null);
}

export function parseCsvRows(content: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(current);
      if (row.some((item) => normalizeText(item))) rows.push(row);
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  row.push(current);
  if (row.some((item) => normalizeText(item))) rows.push(row);
  return rows;
}

export function parseCsvObjects(content: string) {
  const rows = parseCsvRows(content);
  if (rows.length === 0) return [];
  const headers = rows[0].map((item) => normalizeText(item));
  return rows.slice(1).map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])),
  );
}

export async function sendWhatsappPromoMessage(params: {
  targetId: string;
  messageText: string;
  mediaUrl?: string | null;
}) {
  const settings = await getOrCreateCrmSettings();
  if (!settings.evolutionEnabled) {
    throw new Error("Evolution API desativada nas configuracoes.");
  }
  const baseUrl = normalizeText(settings.evolutionBaseUrl);
  const apiKey = normalizeText(settings.evolutionApiKey);
  const instance = normalizeText(settings.evolutionInstanceName);
  if (!baseUrl || !apiKey || !instance) {
    throw new Error("Configuracao da Evolution API incompleta.");
  }
  if (!normalizeText(params.targetId)) {
    throw new Error("Grupo/alvo do WhatsApp nao configurado.");
  }

  const mediaUrl = normalizeText(params.mediaUrl);
  const endpoint = `${baseUrl.replace(/\/+$/, "")}/message/${mediaUrl ? "sendMedia" : "sendText"}/${encodeURIComponent(instance)}`;
  const extFromMime = (mime: string) => {
    if (/png/i.test(mime)) return "png";
    if (/webp/i.test(mime)) return "webp";
    if (/gif/i.test(mime)) return "gif";
    return "jpg";
  };

  const sendPayload = async (body: Record<string, unknown>) => {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return {
      ok: res.ok,
      status: res.status,
      data,
      message: data?.message || data?.error || `Falha ao enviar mensagem (${res.status})`,
    };
  };

  if (!mediaUrl) {
    const textResult = await sendPayload({ number: params.targetId, groupJid: params.targetId, text: params.messageText });
    if (!textResult.ok) throw new Error(textResult.message);
    return textResult.data;
  }

  const mediaRes = await fetch(mediaUrl, { cache: "no-store" });
  if (!mediaRes.ok) {
    throw new Error(`Midia indisponivel (${mediaRes.status})`);
  }
  const mimetype = normalizeText(mediaRes.headers.get("content-type")) || "image/jpeg";
  if (!/^image\//i.test(mimetype)) {
    throw new Error(`Conteudo da midia invalido: ${mimetype}`);
  }
  const buffer = Buffer.from(await mediaRes.arrayBuffer());
  const fileName = `whatsapp-promo.${extFromMime(mimetype)}`;
  const base64Media = buffer.toString("base64");

  const mediaBody = {
    number: params.targetId,
    groupJid: params.targetId,
    mediatype: "image",
    mimetype,
    fileName,
    media: mediaUrl,
    caption: params.messageText,
  };
  const mediaResult = await sendPayload(mediaBody);
  if (mediaResult.ok) return mediaResult.data;

  try {
    const inlineResult = await sendPayload({ ...mediaBody, media: base64Media });
    if (inlineResult.ok) return inlineResult.data;
    throw new Error(inlineResult.message);
  } catch (inlineError: any) {
    throw new Error(`${mediaResult.message}. Fallback de midia falhou: ${inlineError?.message || "erro desconhecido"}`);
  }
}

export async function runWhatsappPromoCron() {
  const settings = await getOrCreateCrmSettings();
  if (!settings.offersCronEnabled) {
    return { ok: true, skipped: true, reason: "WhatsApp promo cron disabled" };
  }

  const now = new Date();
  const currentHour = now.getHours();
  if (currentHour < settings.offersDailyStartHour || currentHour > settings.offersDailyEndHour) {
    return { ok: true, skipped: true, reason: "Outside daily publication window" };
  }

  const dueAt = settings.offersNextRunAt || settings.offersLastRunAt;
  if (dueAt && settings.offersNextRunAt && settings.offersNextRunAt > now) {
    return { ok: true, skipped: true, reason: "Next cron run not due", nextRunAt: settings.offersNextRunAt };
  }

  const post = await prisma.whatsappPromoPost.findFirst({
    where: {
      status: "SCHEDULED",
      scheduledTo: { lte: now },
    },
    orderBy: [{ scheduledTo: "asc" }, { createdAt: "asc" }],
    include: { catalogItem: true },
  });

  const nextRunAt = new Date(now.getTime() + Math.max(5, Number(settings.offersPublishIntervalMin || 60)) * 60 * 1000);
  await prisma.crmSettings.update({
    where: { id: settings.id },
    data: { offersLastRunAt: now, offersNextRunAt: nextRunAt },
  });

  if (!post) {
    return { ok: true, skipped: true, reason: "No scheduled WhatsApp promo due", nextRunAt };
  }

  try {
    const delivery = await sendWhatsappPromoMessage({
      targetId: normalizeText(post.targetId || settings.offersGroupTargetId),
      messageText: post.bodyText,
      mediaUrl: post.mediaUrl || post.catalogItem.imageUrl,
    });
    await prisma.$transaction([
      prisma.whatsappPromoPost.update({
        where: { id: post.id },
        data: {
          status: "SENT",
          sentAt: now,
          errorMessage: null,
          deliveryPayload: JSON.stringify(delivery || {}),
        },
      }),
      prisma.whatsappPromoCatalogItem.update({
        where: { id: post.catalogItemId },
        data: { lastPublishedAt: now },
      }),
    ]);
    return { ok: true, sent: true, postId: post.id, nextRunAt };
  } catch (error: any) {
    await prisma.whatsappPromoPost.update({
      where: { id: post.id },
      data: {
        status: "FAILED",
        errorMessage: error?.message || "Falha ao enviar promocao",
      },
    });
    return { ok: false, sent: false, postId: post.id, error: error?.message || "Falha ao enviar promocao", nextRunAt };
  }
}

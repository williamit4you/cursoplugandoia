import { NextRequest, NextResponse } from "next/server";
import { getChannels } from "@/lib/youtubeAnalyticsRepo";
import { fetchChannelByHandle, fetchMultipleChannels } from "@/lib/youtubeDataApi";
import { prisma } from "@/lib/prisma";
import { upsertChannel, recalculateRankings } from "@/lib/youtubeAnalyticsRepo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const filters = {
      search: searchParams.get("search") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      country: searchParams.get("country") || undefined,
      sortBy: searchParams.get("sortBy") || "rankPosition",
      sortOrder: (searchParams.get("sortOrder") || "asc") as "asc" | "desc",
      page: parseInt(searchParams.get("page") || "1", 10),
      pageSize: parseInt(searchParams.get("pageSize") || "20", 10),
    };

    const result = await getChannels(filters);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Channels list error:", error);
    return NextResponse.json(
      { error: "Falha ao buscar canais" },
      { status: 500 }
    );
  }
}

function normalizeChannelInput(value: string) {
  const v = value.trim();
  if (!v) return { kind: "empty" as const };

  // Channel ID
  if (/^UC[a-zA-Z0-9_-]{20,}$/.test(v)) {
    return { kind: "channelId" as const, channelId: v };
  }

  // Handle
  if (v.startsWith("@")) {
    return { kind: "handle" as const, handle: v };
  }

  // URL
  if (v.startsWith("http://") || v.startsWith("https://")) {
    try {
      const u = new URL(v);
      const path = u.pathname || "";
      const m = path.match(/\/channel\/(UC[a-zA-Z0-9_-]{20,})/);
      if (m?.[1]) return { kind: "channelId" as const, channelId: m[1] };

      const at = path.match(/\/(@[a-zA-Z0-9._-]{3,})/);
      if (at?.[1]) return { kind: "handle" as const, handle: at[1] };
    } catch {
      // ignore
    }
    return { kind: "unknown" as const, raw: v };
  }

  // Plain handle without @
  if (/^[a-zA-Z0-9._-]{3,}$/.test(v)) {
    return { kind: "handle" as const, handle: v.startsWith("@") ? v : `@${v}` };
  }

  return { kind: "unknown" as const, raw: v };
}

/**
 * POST /api/youtube-analytics/channels
 * Body:
 *  - inputs: string[] (channelId | @handle | url)
 *  - categoryId?: string
 *  - categorySlug?: string
 *  - country?: string (override)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const inputs: string[] = Array.isArray(body?.inputs) ? body.inputs : [];
    const categoryId: string | undefined = body?.categoryId || undefined;
    const categorySlug: string | undefined = body?.categorySlug || undefined;
    const countryOverride: string | undefined = body?.country || undefined;

    if (inputs.length === 0) {
      return NextResponse.json({ error: "inputs is required" }, { status: 400 });
    }

    let resolvedCategoryId = categoryId;
    if (!resolvedCategoryId && categorySlug) {
      const cat = await prisma.ytCategory.findUnique({ where: { slug: categorySlug } });
      resolvedCategoryId = cat?.id;
    }
    if (!resolvedCategoryId) {
      const first = await prisma.ytCategory.findFirst({ orderBy: { name: "asc" } });
      resolvedCategoryId = first?.id;
    }
    if (!resolvedCategoryId) {
      return NextResponse.json({ error: "Nenhuma categoria cadastrada" }, { status: 400 });
    }

    const results = {
      createdOrUpdated: 0,
      skipped: 0,
      errors: [] as Array<{ input: string; error: string }>,
    };

    for (const raw of inputs) {
      const parsed = normalizeChannelInput(String(raw || ""));
      if (parsed.kind === "empty") continue;

      try {
        if (parsed.kind === "handle") {
          const data = await fetchChannelByHandle(parsed.handle);
          if (!data) {
            results.errors.push({ input: raw, error: "Handle não encontrado" });
            continue;
          }
          if (countryOverride) data.country = countryOverride;
          await upsertChannel(data, resolvedCategoryId);
          results.createdOrUpdated++;
          continue;
        }

        if (parsed.kind === "channelId") {
          const [data] = await fetchMultipleChannels([parsed.channelId]);
          if (!data) {
            results.errors.push({ input: raw, error: "Channel ID não encontrado" });
            continue;
          }
          if (countryOverride) data.country = countryOverride;
          await upsertChannel(data, resolvedCategoryId);
          results.createdOrUpdated++;
          continue;
        }

        results.errors.push({ input: raw, error: "Formato não suportado (use UC… / @handle / URL)" });
      } catch (e: any) {
        results.errors.push({ input: raw, error: e?.message || "Erro ao cadastrar" });
      }
    }

    // Atualiza rankPosition para manter listagem consistente
    await recalculateRankings();

    return NextResponse.json({ success: true, ...results });
  } catch (error: any) {
    console.error("Channels create error:", error);
    return NextResponse.json(
      { error: error?.message || "Falha ao cadastrar canais" },
      { status: 500 }
    );
  }
}

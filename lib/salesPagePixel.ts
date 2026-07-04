import { META_PIXEL_ID } from "@/lib/metaPixelConfig";
import { getSalesPageConfig } from "@/lib/salesPageConfig";

function normalizePixelId(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

type ResolveSalesPageMetaPixelOptions = {
  preferEnvFallback?: boolean;
};

export async function resolveSalesPageMetaPixelId(
  pageKey: string,
  options: ResolveSalesPageMetaPixelOptions = {},
) {
  const envPixelId = normalizePixelId(META_PIXEL_ID);
  let dbPixelId: string | null = null;

  try {
    const config = await getSalesPageConfig(pageKey);
    dbPixelId = normalizePixelId(config?.metaPixelId);
  } catch (error: any) {
    // During the transition window the migration may not have run yet.
    // In that case, keep the landing operational with the env-based pixel.
    if (error?.code !== "P2022") {
      throw error;
    }
  }

  // Transitional rule for the current landing:
  // if env exists, use it first; otherwise fall back to the database config.
  if (options.preferEnvFallback) {
    return envPixelId ?? dbPixelId;
  }

  // Default rule for future landing pages:
  // use the pixel configured in the database only.
  return dbPixelId;
}

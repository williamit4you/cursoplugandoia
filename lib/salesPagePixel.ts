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
    const isRecoverableBuildFailure =
      error?.code === "P2022" ||
      error?.code === "EACCES" ||
      error?.code === "ECONNREFUSED" ||
      error?.code === "ETIMEDOUT";

    if (!isRecoverableBuildFailure) {
      throw error;
    }

    console.warn(`sales page pixel fallback for ${pageKey}`, error);
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

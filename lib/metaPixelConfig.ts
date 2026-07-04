function normalizePixelId(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export const META_PIXEL_ID = normalizePixelId(process.env.NEXT_PUBLIC_META_PIXEL_ID) ?? normalizePixelId(process.env.META_PIXEL_ID);

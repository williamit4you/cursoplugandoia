export type FreeMediaOrientation = "portrait" | "landscape";

export type FreeMediaAsset = {
  id: string;
  provider: "PEXELS" | "PIXABAY" | "UNSPLASH";
  kind: "IMAGE" | "VIDEO";
  url: string;
  thumbnail: string | null;
  width: number | null;
  height: number | null;
  durationSec: number | null;
  authorName: string | null;
  attributionUrl: string | null;
  score: number;
};

type SearchOptions = {
  limit?: number;
  orientation?: FreeMediaOrientation;
  includeImages?: boolean;
  includeVideos?: boolean;
};

function normalizeQuery(query: string) {
  return query.replace(/\s+/g, " ").trim();
}

function buildOrientationScore(width: number | null, height: number | null, orientation: FreeMediaOrientation) {
  if (!width || !height) return 0;
  const isPortrait = height > width;
  return orientation === "portrait" ? (isPortrait ? 18 : -8) : !isPortrait ? 18 : -8;
}

function dedupeAssets(assets: FreeMediaAsset[]) {
  const seen = new Set<string>();
  return assets.filter((asset) => {
    const key = asset.url.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function searchPexelsMedia(
  query: string,
  limit = 5,
  orientation: FreeMediaOrientation = "portrait"
): Promise<FreeMediaAsset[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/videos/search?query=${encodeURIComponent(normalizeQuery(query))}&per_page=${limit}&orientation=${orientation}&size=medium`,
      {
        headers: { Authorization: apiKey },
      }
    );

    if (!res.ok) return [];

    const data = await res.json();
    return (data.videos || [])
      .map((video: any) => {
        const files = Array.isArray(video.video_files) ? video.video_files : [];
        const candidates = files
          .filter((file: any) => Number(file?.width) > 0 && Number(file?.height) > 0 && String(file?.link || "").trim())
          .sort((a: any, b: any) => {
            const aScore = buildOrientationScore(Number(a?.width) || null, Number(a?.height) || null, orientation);
            const bScore = buildOrientationScore(Number(b?.width) || null, Number(b?.height) || null, orientation);
            const aPixels = (Number(a?.width) || 0) * (Number(a?.height) || 0);
            const bPixels = (Number(b?.width) || 0) * (Number(b?.height) || 0);
            return bScore - aScore || bPixels - aPixels;
          });

        const chosen = candidates[0];
        if (!chosen?.link) return null;

        return {
          id: `pexels-video-${video.id}`,
          provider: "PEXELS" as const,
          kind: "VIDEO" as const,
          url: String(chosen.link),
          thumbnail: String(video.image || "").trim() || null,
          width: Number(chosen.width) || null,
          height: Number(chosen.height) || null,
          durationSec: Number(video.duration) || null,
          authorName: String(video.user?.name || "").trim() || null,
          attributionUrl: String(video.url || "").trim() || null,
          score: 100 + buildOrientationScore(Number(chosen.width) || null, Number(chosen.height) || null, orientation),
        };
      })
      .filter(Boolean) as FreeMediaAsset[];
  } catch (error) {
    console.error("[searchPexelsMedia]", error);
    return [];
  }
}

async function searchPixabayVideos(
  query: string,
  limit: number,
  orientation: FreeMediaOrientation
): Promise<FreeMediaAsset[]> {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://pixabay.com/api/videos/?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(normalizeQuery(query))}&per_page=${limit}&safesearch=true`,
      { headers: { Accept: "application/json" } }
    );

    if (!res.ok) return [];

    const data = await res.json();
    return (data.hits || [])
      .map((video: any) => {
        const variants = Object.values(video.videos || {}) as Array<any>;
        const candidates = variants
          .filter((item) => Number(item?.width) > 0 && Number(item?.height) > 0 && String(item?.url || "").trim())
          .sort((a, b) => {
            const aScore = buildOrientationScore(Number(a?.width) || null, Number(a?.height) || null, orientation);
            const bScore = buildOrientationScore(Number(b?.width) || null, Number(b?.height) || null, orientation);
            const aPixels = (Number(a?.width) || 0) * (Number(a?.height) || 0);
            const bPixels = (Number(b?.width) || 0) * (Number(b?.height) || 0);
            return bScore - aScore || bPixels - aPixels;
          });

        const chosen = candidates[0];
        if (!chosen?.url) return null;

        return {
          id: `pixabay-video-${video.id}`,
          provider: "PIXABAY" as const,
          kind: "VIDEO" as const,
          url: String(chosen.url),
          thumbnail: null,
          width: Number(chosen.width) || null,
          height: Number(chosen.height) || null,
          durationSec: Number(video.duration) || null,
          authorName: String(video.user || "").trim() || null,
          attributionUrl: video.pageURL ? String(video.pageURL) : null,
          score: 88 + buildOrientationScore(Number(chosen.width) || null, Number(chosen.height) || null, orientation),
        };
      })
      .filter(Boolean) as FreeMediaAsset[];
  } catch (error) {
    console.error("[searchPixabayVideos]", error);
    return [];
  }
}

async function searchPixabayImages(
  query: string,
  limit: number,
  orientation: FreeMediaOrientation
): Promise<FreeMediaAsset[]> {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) return [];

  try {
    const imageOrientation = orientation === "portrait" ? "vertical" : "horizontal";
    const res = await fetch(
      `https://pixabay.com/api/?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(normalizeQuery(query))}&image_type=photo&orientation=${imageOrientation}&per_page=${limit}&safesearch=true`,
      { headers: { Accept: "application/json" } }
    );

    if (!res.ok) return [];

    const data = await res.json();
    return (data.hits || [])
      .map((image: any) => {
        const url = String(image.largeImageURL || image.webformatURL || "").trim();
        if (!url) return null;

        return {
          id: `pixabay-image-${image.id}`,
          provider: "PIXABAY" as const,
          kind: "IMAGE" as const,
          url,
          thumbnail: String(image.previewURL || image.webformatURL || "").trim() || null,
          width: Number(image.imageWidth) || null,
          height: Number(image.imageHeight) || null,
          durationSec: null,
          authorName: String(image.user || "").trim() || null,
          attributionUrl: String(image.pageURL || "").trim() || null,
          score: 70 + buildOrientationScore(Number(image.imageWidth) || null, Number(image.imageHeight) || null, orientation),
        };
      })
      .filter(Boolean) as FreeMediaAsset[];
  } catch (error) {
    console.error("[searchPixabayImages]", error);
    return [];
  }
}

async function searchUnsplashImages(
  query: string,
  limit: number,
  orientation: FreeMediaOrientation
): Promise<FreeMediaAsset[]> {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(normalizeQuery(query))}&per_page=${Math.min(limit, 30)}&orientation=${orientation}&content_filter=high`,
      {
        headers: {
          Authorization: `Client-ID ${apiKey}`,
          "Accept-Version": "v1",
        },
      }
    );

    if (!res.ok) return [];

    const data = await res.json();
    return (data.results || [])
      .map((image: any) => {
        const url = String(image.urls?.regular || image.urls?.full || image.urls?.raw || "").trim();
        if (!url) return null;

        return {
          id: `unsplash-image-${image.id}`,
          provider: "UNSPLASH" as const,
          kind: "IMAGE" as const,
          url,
          thumbnail: String(image.urls?.thumb || image.urls?.small || "").trim() || null,
          width: Number(image.width) || null,
          height: Number(image.height) || null,
          durationSec: null,
          authorName: String(image.user?.name || "").trim() || null,
          attributionUrl: String(image.links?.html || "").trim() || null,
          score: 78 + buildOrientationScore(Number(image.width) || null, Number(image.height) || null, orientation),
        };
      })
      .filter(Boolean) as FreeMediaAsset[];
  } catch (error) {
    console.error("[searchUnsplashImages]", error);
    return [];
  }
}

export async function searchFreeMedia(query: string, options: SearchOptions = {}) {
  const limit = Math.max(1, Math.min(12, options.limit ?? 6));
  const orientation = options.orientation ?? "portrait";
  const includeImages = options.includeImages !== false;
  const includeVideos = options.includeVideos !== false;
  const safeQuery = normalizeQuery(query);
  if (!safeQuery) return [];

  const [pexelsVideos, pixabayVideos, pixabayImages, unsplashImages] = await Promise.all([
    includeVideos ? searchPexelsMedia(safeQuery, limit, orientation) : Promise.resolve([]),
    includeVideos ? searchPixabayVideos(safeQuery, limit, orientation) : Promise.resolve([]),
    includeImages ? searchPixabayImages(safeQuery, limit, orientation) : Promise.resolve([]),
    includeImages ? searchUnsplashImages(safeQuery, limit, orientation) : Promise.resolve([]),
  ]);

  const ordered = dedupeAssets(
    [...pexelsVideos, ...pixabayVideos, ...pixabayImages, ...unsplashImages].sort((a, b) => b.score - a.score)
  );

  return ordered.slice(0, limit);
}

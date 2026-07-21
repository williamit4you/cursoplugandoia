export type PexelsAsset = {
  id: number;
  type: string;
  url: string;
  thumbnail: string;
};

export async function searchPexelsMedia(
  query: string,
  limit = 5,
  orientation: "portrait" | "landscape" = "portrait"
): Promise<PexelsAsset[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${limit}&orientation=${orientation}&size=medium`,
      {
        headers: { Authorization: apiKey },
      }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const videos = (data.videos || []).map((v: any) => {
      const files = v.video_files || [];
      const preferred = files.filter((f: any) => Number(f?.height) >= 720);
      const chosen = preferred.length > 0 ? preferred[0] : files[0];
      return {
        id: v.id,
        type: "video",
        url: chosen?.link,
        thumbnail: v.image,
      };
    });

    return videos.filter((video: PexelsAsset) => Boolean(video.url));
  } catch (error) {
    console.error("[searchPexelsMedia]", error);
    return [];
  }
}

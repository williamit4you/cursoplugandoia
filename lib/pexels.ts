export async function searchPexelsMedia(query: string, limit = 5) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${limit}&orientation=portrait&size=medium`,
      {
        headers: { Authorization: apiKey },
      }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const videos = (data.videos || []).map((v: any) => {
      const files = v.video_files || [];
      // Prefer portrait files >= 720p
      const portrait = files.filter((f: any) => f.height >= 720);
      const chosen = portrait.length > 0 ? portrait[0] : files[0];
      return {
        id: v.id,
        type: "video",
        url: chosen?.link,
        thumbnail: v.image,
      };
    });

    return videos;
  } catch (error) {
    console.error("[searchPexelsMedia]", error);
    return [];
  }
}

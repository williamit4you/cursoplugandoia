/**
 * lib/tiktokApi.ts
 *
 * TikTok Content Posting API v2 — Direct Post via URL pull.
 * Docs: https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
 *
 * Requer access_token com escopo: video.publish
 */

export async function publishTikTokVideo(
  videoUrl: string,
  title: string,
  accessToken: string
): Promise<string> {
  const res = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      post_info: {
        title: title.slice(0, 150), // máx 150 chars
        privacy_level: "PUBLIC_TO_EVERYONE",
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 1000,
      },
      source_info: {
        source: "PULL_FROM_URL",
        video_url: videoUrl,
      },
    }),
  });

  const data = await res.json();

  if (data.error?.code && data.error.code !== "ok") {
    throw new Error(`TikTok API error: ${data.error.message || data.error.code}`);
  }

  return data.data?.publish_id || "pending";
}

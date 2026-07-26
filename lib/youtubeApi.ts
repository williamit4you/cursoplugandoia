import { google } from "googleapis";
import { Readable } from "stream";

export async function publishYouTubeVideo({
  title,
  description,
  videoUrl,
  accessToken,
  refreshToken,
  clientId,
  clientSecret,
  redirectUri,
  thumbnailUrl,
}: {
  title: string;
  description: string;
  videoUrl: string;
  accessToken: string;
  refreshToken: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  thumbnailUrl?: string | null;
}) {
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  // Não confie em `access_token` persistido (pode estar expirado e sem `expiry_date`).
  // Use o `refresh_token` para sempre obter um access token válido antes do upload.
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  await oauth2Client.getAccessToken();

  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  // Download video using fetch
  const response = await fetch(videoUrl);
  if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`);
  if (!response.body) throw new Error("Video response body is null");

  // Convert Web Stream to Node Readable Stream
  const nodeReadable = Readable.fromWeb(response.body as any);

  const res = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: title.slice(0, 100), // YouTube title limit
        description,
        categoryId: "22", // People & Blogs
      },
      status: {
        privacyStatus: "public",
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: nodeReadable,
    },
  });

  const videoId = res.data.id;
  if (!videoId) throw new Error("YouTube nao retornou o ID do video publicado");
  if (!videoId) throw new Error("YouTube nao retornou o ID do video publicado");
  if (videoId && thumbnailUrl) {
    const thumb = await fetch(thumbnailUrl);
    if (!thumb.ok || !thumb.body) throw new Error(`Falha ao baixar thumbnail: ${thumb.status}`);
    await youtube.thumbnails.set({ videoId, media: { body: Readable.fromWeb(thumb.body as any) } });
  }

  return videoId;
}

export async function getYouTubeVideoViews({
  videoId,
  clientId,
  clientSecret,
  refreshToken,
}: {
  videoId: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}) {
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const youtube = google.youtube({ version: "v3", auth: oauth2Client });
  const res = await youtube.videos.list({
    id: [videoId],
    part: ["statistics"],
  });

  const stats = res.data.items?.[0]?.statistics;
  return Number(stats?.viewCount || 0);
}

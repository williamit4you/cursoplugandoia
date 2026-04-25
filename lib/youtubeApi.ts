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
}: {
  title: string;
  description: string;
  videoUrl: string;
  accessToken: string;
  refreshToken: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}) {
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

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

  return res.data.id;
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

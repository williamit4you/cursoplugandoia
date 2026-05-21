const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const { google } = require("googleapis");
const { Readable } = require("stream");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const post = await prisma.socialPost.findFirst({
    where: { platform: "YOUTUBE", status: "SCHEDULED" },
    orderBy: { createdAt: "desc" }
  });

  if (!post) {
    console.log("No scheduled YOUTUBE post found");
    return;
  }

  console.log("Found scheduled post:", post.id, "Video URL:", post.videoUrl);

  const settings = await prisma.integrationSettings.findUnique({
    where: { platform: "YOUTUBE" }
  });

  if (!settings) {
    console.log("No YOUTUBE settings found");
    return;
  }

  console.log("YouTube Settings found. Client ID:", settings.apiKey);

  const redirectUri = `http://localhost:3000/api/integrations/youtube/callback`;
  const oauth2Client = new google.auth.OAuth2(settings.apiKey, settings.apiSecret, redirectUri);
  oauth2Client.setCredentials({ refresh_token: settings.refreshToken });

  console.log("Refreshing access token...");
  try {
    const tokenInfo = await oauth2Client.getAccessToken();
    console.log("Token refreshed successfully! Token:", tokenInfo.token ? "present" : "missing");
  } catch (err) {
    console.error("Failed to refresh access token:", err);
    return;
  }

  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  console.log("Downloading video from:", post.videoUrl);
  const response = await fetch(post.videoUrl);
  if (!response.ok) {
    console.error(`Failed to fetch video: ${response.status} ${response.statusText}`);
    return;
  }
  if (!response.body) {
    console.error("Video response body is null");
    return;
  }

  const nodeReadable = Readable.fromWeb(response.body);
  console.log("Uploading to YouTube as private...");
  try {
    const res = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: "Test upload " + new Date().toISOString(),
          description: "Testing API integration settings",
          categoryId: "22",
        },
        status: {
          privacyStatus: "private",
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: nodeReadable,
      },
    });
    console.log("Success! Video ID:", res.data.id);
  } catch (err) {
    console.error("YouTube insert failed:");
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err);
    }
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

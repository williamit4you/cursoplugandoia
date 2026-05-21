const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set in environment!");
  process.exit(1);
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== Checking IntegrationSettings for YOUTUBE ===");
  const integration = await prisma.integrationSettings.findUnique({
    where: { platform: "YOUTUBE" }
  });
  if (integration) {
    console.log({
      id: integration.id,
      platform: integration.platform,
      isActive: integration.isActive,
      hasApiKey: !!integration.apiKey,
      hasApiSecret: !!integration.apiSecret,
      hasAccessToken: !!integration.accessToken,
      hasRefreshToken: !!integration.refreshToken,
      updatedAt: integration.updatedAt
    });
  } else {
    console.log("No YOUTUBE integration config found.");
  }

  console.log("\n=== Checking YouTube SocialPosts ===");
  const ytPosts = await prisma.socialPost.findMany({
    where: { platform: "YOUTUBE" },
    orderBy: { createdAt: "desc" },
    take: 10
  });

  for (const post of ytPosts) {
    console.log(`ID: ${post.id}`);
    console.log(`Status: ${post.status}`);
    console.log(`ScheduledTo: ${post.scheduledTo}`);
    console.log(`PostedAt: ${post.postedAt}`);
    console.log(`YouTubePostedAt: ${post.youtubePostedAt}`);
    console.log(`VideoUrl: ${post.videoUrl}`);
    console.log(`Log: ${post.log}`);
    console.log("-----------------------------------------");
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

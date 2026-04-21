const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const post = await prisma.post.findFirst();
    if (!post) {
       console.log("No post found!"); return;
    }
    const sp = await prisma.socialPost.create({
      data: {
        postId: post.id,
        summary: "test summary",
        videoUrl: "http://test",
        status: "SCHEDULED",
        scheduledTo: new Date(),
        log: "Test log"
      }
    });
    console.log("SUCCESS:", sp);
  } catch (err) {
    console.error("PRISMA ERROR:", err);
  }
}
main().finally(() => prisma.$disconnect());

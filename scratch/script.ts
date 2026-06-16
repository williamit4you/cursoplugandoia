import { prisma } from '../lib/prisma';
async function main() {
  const posts = await prisma.socialPost.findMany({
    where: { platform: 'META' },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(posts, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());

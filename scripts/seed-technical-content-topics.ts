import { prisma } from "../lib/prisma";
import { technicalContentTopics } from "../lib/technicalContentTopics";

async function main() {
  await prisma.technicalContentConfig.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
  for (const topic of technicalContentTopics) {
    await prisma.technicalContentTopic.upsert({
      where: { funnel_keyword: { funnel: topic.funnel, keyword: topic.keyword } },
      update: { title: topic.title, searchIntent: topic.searchIntent, angle: topic.angle, priority: topic.priority },
      create: topic,
    });
  }
  console.log(`Pautas técnicas configuradas: ${technicalContentTopics.length} (200 por funil).`);
}

main().catch((error) => { console.error(error); process.exit(1); });

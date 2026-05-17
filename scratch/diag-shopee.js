const { PrismaClient } = require("@prisma/client");

const LOCK_TTL_MS = 30 * 60 * 1000;

async function main() {
  const prisma = new PrismaClient();
  const now = new Date();
  const lockExpiry = new Date(now.getTime() - LOCK_TTL_MS);

  const base = { active: true, pipelineStatus: { notIn: ["PAUSED", "PUBLISHED"] } };

  const [totalActive, baseCount, eligibleCount, futureCount, lockedCount, sampleFuture, sampleLocked] = await Promise.all([
    prisma.coletaDadosShoppe.count({ where: { active: true } }),
    prisma.coletaDadosShoppe.count({ where: base }),
    prisma.coletaDadosShoppe.count({
      where: {
        ...base,
        AND: [
          { OR: [{ nextRunAt: null }, { nextRunAt: { lte: now } }] },
          { OR: [{ lockedAt: null }, { lockedAt: { lt: lockExpiry } }] },
        ],
      },
    }),
    prisma.coletaDadosShoppe.count({ where: { ...base, nextRunAt: { gt: now } } }),
    prisma.coletaDadosShoppe.count({ where: { ...base, lockedAt: { gte: lockExpiry } } }),
    prisma.coletaDadosShoppe.findFirst({
      where: { ...base, nextRunAt: { gt: now } },
      orderBy: { nextRunAt: "asc" },
      select: { id: true, pipelineStatus: true, nextRunAt: true, lockedAt: true, lockedBy: true, priority: true },
    }),
    prisma.coletaDadosShoppe.findFirst({
      where: { ...base, lockedAt: { gte: lockExpiry } },
      orderBy: { lockedAt: "desc" },
      select: { id: true, pipelineStatus: true, nextRunAt: true, lockedAt: true, lockedBy: true, priority: true },
    }),
  ]);

  console.log(
    JSON.stringify(
      {
        now: now.toISOString(),
        lockExpiry: lockExpiry.toISOString(),
        counts: { totalActive, baseCount, eligibleCount, futureCount, lockedCount },
        sampleFuture,
        sampleLocked,
      },
      null,
      2
    )
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

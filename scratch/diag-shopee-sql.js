const { Client } = require("pg");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const now = new Date();
  const lockExpiry = new Date(now.getTime() - 30 * 60 * 1000);

  const baseWhere = `"active" = true AND "pipelineStatus" NOT IN ('PAUSED','PUBLISHED')`;
  const eligibleWhere = `${baseWhere} AND ("nextRunAt" IS NULL OR "nextRunAt" <= $1) AND ("lockedAt" IS NULL OR "lockedAt" < $2)`;

  const counts = await client.query(
    `SELECT
      (SELECT count(*)::int FROM "ColetaDadosShoppe" WHERE "active" = true) AS "totalActive",
      (SELECT count(*)::int FROM "ColetaDadosShoppe" WHERE ${baseWhere}) AS "baseCount",
      (SELECT count(*)::int FROM "ColetaDadosShoppe" WHERE ${eligibleWhere}) AS "eligible",
      (SELECT count(*)::int FROM "ColetaDadosShoppe" WHERE ${baseWhere} AND "nextRunAt" > $1) AS "blockedByNextRunAt",
      (SELECT count(*)::int FROM "ColetaDadosShoppe" WHERE ${baseWhere} AND "lockedAt" >= $2) AS "blockedByLock"`,
    [now, lockExpiry]
  );

  const cfg = await client.query(
    `SELECT "id", "enabled", "runEveryMinutes", "maxItemsPerRun", "lastCronRunAt", "nextCronRunAt", "createdAt"
     FROM "ShopeePipelineConfig" ORDER BY "createdAt" DESC LIMIT 1`
  );

  const pendingSample = await client.query(
    `SELECT "id", "pipelineStatus", "priority", "nextRunAt", "lockedAt", "lockedBy", "createdAt"
     FROM "ColetaDadosShoppe" WHERE "active" = true AND "pipelineStatus" = 'PENDING' ORDER BY "createdAt" ASC LIMIT 5`
  );

  console.log(
    JSON.stringify(
      {
        now: now.toISOString(),
        lockExpiry: lockExpiry.toISOString(),
        counts: counts.rows[0] || null,
        latestConfig: cfg.rows[0] || null,
        pendingSamples: pendingSample.rows || [],
      },
      null,
      2
    )
  );

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

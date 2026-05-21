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
  console.log("=== Checking ShopeePipelineConfig (ENGAGEMENT) ===");
  const configs = await prisma.shopeePipelineConfig.findMany({
    where: { pipelineKind: "ENGAGEMENT" }
  });
  console.log(JSON.stringify(configs, null, 2));

  console.log("\n=== Checking Latest Engagement Coletas ===");
  const coletas = await prisma.coletaDadosShoppe.findMany({
    where: { pipelineKind: "ENGAGEMENT" },
    orderBy: { updatedAt: "desc" },
    take: 5
  });
  for (const c of coletas) {
    console.log(`ID: ${c.id}`);
    console.log(`URL: ${c.url}`);
    console.log(`Status: ${c.pipelineStatus}`);
    console.log(`LastError: ${c.lastError}`);
    console.log(`Has Audio URL: ${!!c.audioUrl}`);
    console.log(`aiPromptEngajamento Length: ${c.aiPromptEngajamento?.length || 0}`);
    console.log(`aiPromptVendas Length: ${c.aiPromptVendas?.length || 0}`);
    console.log("-----------------------------------------");
  }

  console.log("\n=== Checking Failed Steps ===");
  const failedSteps = await prisma.shopeePipelineStep.findMany({
    where: {
      status: "FAILED",
      coleta: { pipelineKind: "ENGAGEMENT" }
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      coleta: true
    }
  });

  for (const step of failedSteps) {
    console.log(`Step ID: ${step.id}`);
    console.log(`Coleta ID: ${step.coletaId}`);
    console.log(`Step Name: ${step.stepName}`);
    console.log(`Error Message: ${step.errorMessage}`);
    console.log(`Request Payload:`, JSON.stringify(step.requestPayload));
    console.log(`Response Payload:`, JSON.stringify(step.responsePayload));
    console.log("=========================================");
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

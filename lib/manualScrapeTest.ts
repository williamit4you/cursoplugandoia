import "server-only";

import { prisma } from "@/lib/prisma";

const TASK_SLUG = "manual-scrape-test";
const TRIGGER_PLATFORM = "MOTOR_TRIGGER";

async function ensureTask() {
  const existing = await prisma.automationTask.findUnique({
    where: { slug: TASK_SLUG },
  });

  if (existing) return existing;

  return prisma.automationTask.create({
    data: {
      name: "Teste rapido de scrape",
      slug: TASK_SLUG,
      type: "NEWS_VIDEO",
      status: "ACTIVE",
      isEnabled: true,
      priority: 1,
      sourceConfigJson: JSON.stringify({ kind: "manual_scrape_test" }),
      creativeConfigJson: "{}",
      publishConfigJson: "{}",
      executionConfigJson: "{}",
    },
  });
}

export async function createManualScrapeTestRun() {
  const task = await ensureTask();

  const run = await prisma.automationTaskRun.create({
    data: {
      taskId: task.id,
      triggerType: "MANUAL",
      status: "RUNNING",
      startedAt: new Date(),
      summary: "Botao clicado. Aguardando o worker buscar as fontes.",
      inputSnapshotJson: JSON.stringify({
        source: "posts_button",
        requestedAt: new Date().toISOString(),
      }),
      steps: {
        create: [
          {
            stepKey: "BUTTON_CLICKED",
            stepOrder: 1,
            status: "COMPLETED",
            startedAt: new Date(),
            finishedAt: new Date(),
            outputJson: JSON.stringify({
              message: "Botao de teste acionado na tela de Posts.",
            }),
          },
          {
            stepKey: "WAITING_WORKER",
            stepOrder: 2,
            status: "RUNNING",
            startedAt: new Date(),
            outputJson: JSON.stringify({
              message: "Aguardando o worker consultar /api/worker/sources e consumir o gatilho manual.",
            }),
          },
        ],
      },
    },
    include: {
      steps: {
        orderBy: { stepOrder: "asc" },
      },
    },
  });

  await prisma.integrationSettings.upsert({
    where: { platform: TRIGGER_PLATFORM },
    update: {
      isActive: true,
      apiSecret: run.id,
    },
    create: {
      platform: TRIGGER_PLATFORM,
      isActive: true,
      apiSecret: run.id,
    },
  });

  return run;
}

export async function consumeManualScrapeTrigger() {
  const triggerInfo = await prisma.integrationSettings.findUnique({
    where: { platform: TRIGGER_PLATFORM },
  });

  const isTriggered = triggerInfo?.isActive === true;
  const runId = String(triggerInfo?.apiSecret || "").trim() || null;

  if (isTriggered) {
    await prisma.integrationSettings.update({
      where: { platform: TRIGGER_PLATFORM },
      data: { isActive: false },
    });
  }

  if (isTriggered && runId) {
    const current = await prisma.automationTaskRun.findUnique({
      where: { id: runId },
      include: {
        steps: true,
      },
    });

    if (current && current.status === "RUNNING") {
      const waitingStep = current.steps.find((step) => step.stepKey === "WAITING_WORKER");
      if (waitingStep) {
        await prisma.automationTaskStepRun.update({
          where: { id: waitingStep.id },
          data: {
            status: "COMPLETED",
            finishedAt: new Date(),
            outputJson: JSON.stringify({
              message: "Worker consultou /api/worker/sources e recebeu trigger_now=true.",
              consumedAt: new Date().toISOString(),
            }),
          },
        });
      }

      await prisma.automationTaskRun.update({
        where: { id: runId },
        data: {
          status: "COMPLETED",
          finishedAt: new Date(),
          summary: "Worker confirmou o consumo do teste manual de scrape.",
          outputSnapshotJson: JSON.stringify({
            triggerConsumed: true,
            consumedAt: new Date().toISOString(),
          }),
        },
      });
    }
  }

  return {
    trigger_now: isTriggered,
    runId,
  };
}

export async function failManualScrapeRun(runId: string, message: string) {
  if (!runId) return;

  const run = await prisma.automationTaskRun.findUnique({
    where: { id: runId },
    include: { steps: true },
  });

  if (!run || run.status !== "RUNNING") return;

  const waitingStep = run.steps.find((step) => step.stepKey === "WAITING_WORKER");
  if (waitingStep) {
    await prisma.automationTaskStepRun.update({
      where: { id: waitingStep.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        errorMessage: message,
        outputJson: JSON.stringify({ error: message }),
      },
    });
  }

  await prisma.automationTaskRun.update({
    where: { id: runId },
    data: {
      status: "FAILED",
      finishedAt: new Date(),
      errorMessage: message,
      summary: message,
      outputSnapshotJson: JSON.stringify({ error: message }),
    },
  });
}

export async function listManualScrapeRuns(limit = 10) {
  const task = await prisma.automationTask.findUnique({
    where: { slug: TASK_SLUG },
    select: { id: true },
  });

  if (!task) return [];

  return prisma.automationTaskRun.findMany({
    where: { taskId: task.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      steps: {
        orderBy: { stepOrder: "asc" },
      },
    },
  });
}

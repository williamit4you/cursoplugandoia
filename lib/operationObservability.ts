import "server-only";

import { prisma } from "@/lib/prisma";

export type OperationKey =
  | "SHOPEE_PIPELINE"
  | "SOCIAL_PUBLISHER"
  | "ENGAGEMENT_PIPELINE"
  | "VIDEO_QUESTIONS"
  | "VIDEO_ENGAGEMENT"
  | "YOUTUBE_ANALYTICS"
  | "NEWS_CONTENT";

const DEFINITIONS: Record<OperationKey, { name: string; family: string; description: string; expectedEverySec: number }> = {
  SHOPEE_PIPELINE: { name: "Shopee e afiliados", family: "PRODUCAO", description: "Coleta produtos, gera ativos e prepara publicacao.", expectedEverySec: 60 },
  SOCIAL_PUBLISHER: { name: "Publicacao social", family: "DISTRIBUICAO", description: "Publica posts agendados nas redes sociais.", expectedEverySec: 60 },
  ENGAGEMENT_PIPELINE: { name: "Video de engajamento", family: "PRODUCAO", description: "Produz videos de engajamento e suas publicacoes.", expectedEverySec: 60 },
  VIDEO_QUESTIONS: { name: "Perguntas e respostas", family: "PRODUCAO", description: "Processa perguntas e gera videos de resposta.", expectedEverySec: 300 },
  VIDEO_ENGAGEMENT: { name: "Video Engagement", family: "PRODUCAO", description: "Executa a fila de projetos de video de engajamento.", expectedEverySec: 60 },
  YOUTUBE_ANALYTICS: { name: "Analytics YouTube", family: "RESULTADO", description: "Atualiza dados e snapshots do YouTube.", expectedEverySec: 3600 },
  NEWS_CONTENT: { name: "Noticias e artigos", family: "CONTEUDO", description: "Coleta noticias e prepara artigos e videos.", expectedEverySec: 3600 },
};

function safeJson(value: unknown) {
  try { return value == null ? null : JSON.stringify(value); } catch { return null; }
}

export async function startOperationRun(operationKey: OperationKey, metadata?: unknown) {
  try {
    const definition = DEFINITIONS[operationKey];
    await prisma.operationDefinition.upsert({
      where: { key: operationKey },
      update: { name: definition.name, family: definition.family, description: definition.description, expectedEverySec: definition.expectedEverySec, enabled: true },
      create: { key: operationKey, ...definition },
    });
    return await prisma.operationRun.create({ data: { operationKey, metadataJson: safeJson(metadata) } });
  } catch (error) {
    console.warn("[observability] nao foi possivel iniciar OperationRun", error instanceof Error ? error.message : error);
    return null;
  }
}

export async function heartbeatOperationRun(runId: string | null | undefined, values?: { itemsFound?: number; itemsProcessed?: number; itemsSucceeded?: number; itemsFailed?: number; nextRunAt?: Date | null }) {
  if (!runId) return;
  try { await prisma.operationRun.update({ where: { runId }, data: { heartbeatAt: new Date(), ...values } }); }
  catch (error) { console.warn("[observability] falha no heartbeat", error instanceof Error ? error.message : error); }
}

export async function finishOperationRun(runId: string | null | undefined, result: { status?: string; itemsFound?: number; itemsProcessed?: number; itemsSucceeded?: number; itemsFailed?: number; estimatedCostUsd?: number; nextRunAt?: Date | null; metadata?: unknown; errorMessage?: string | null }) {
  if (!runId) return;
  try {
    await prisma.operationRun.update({
      where: { runId },
      data: {
        status: result.status || "SUCCESS", heartbeatAt: new Date(), finishedAt: new Date(),
        itemsFound: result.itemsFound, itemsProcessed: result.itemsProcessed, itemsSucceeded: result.itemsSucceeded,
        itemsFailed: result.itemsFailed, estimatedCostUsd: result.estimatedCostUsd, nextRunAt: result.nextRunAt,
        errorMessage: result.errorMessage || null, metadataJson: safeJson(result.metadata),
      },
    });
  } catch (error) { console.warn("[observability] falha ao finalizar OperationRun", error instanceof Error ? error.message : error); }
}

export { DEFINITIONS };

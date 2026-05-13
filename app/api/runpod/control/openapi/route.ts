import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";
import { getRunpodManagerDefaults } from "@/lib/shopee-pipeline/runpodManager";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await requireAdminOrCronSecret(req);
    const defaults = getRunpodManagerDefaults();

    return NextResponse.json({
      openapi: "3.1.0",
      info: {
        title: "Runpod Pod Control API",
        version: "1.0.0",
        description: "Endpoints internos da aplicacao para ligar, criar um novo pod e desligar o pod atual do ComfyUI.",
      },
      servers: [{ url: req.nextUrl.origin }],
      paths: {
        "/api/runpod/control": {
          get: {
            summary: "Ler status do pod atual",
            responses: {
              "200": { description: "Status atual do gerenciador Runpod." },
            },
          },
          post: {
            summary: "Executar uma acao no pod",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["action"],
                    properties: {
                      action: {
                        type: "string",
                        enum: ["ligar", "ligarnovo", "desligar"],
                      },
                      timeoutMs: {
                        type: "integer",
                        minimum: 30000,
                        default: 180000,
                      },
                    },
                  },
                  examples: {
                    ligar: { value: { action: "ligar", timeoutMs: 180000 } },
                    ligarnovo: { value: { action: "ligarnovo", timeoutMs: 180000 } },
                    desligar: { value: { action: "desligar" } },
                  },
                },
              },
            },
            responses: {
              "200": { description: "Acao executada com sucesso." },
              "401": { description: "Sessao admin ou secret obrigatorio." },
              "500": { description: "Falha ao falar com a API do Runpod ou readiness do ComfyUI." },
            },
          },
        },
      },
      components: {
        securitySchemes: {
          adminSessionOrSecret: {
            type: "apiKey",
            in: "query",
            name: "secret",
            description: "Use ?secret=CRON_SECRET se quiser testar sem login de admin.",
          },
        },
        schemas: {
          RunpodDefaults: {
            type: "object",
            properties: {
              imageName: { type: "string", default: defaults.imageName },
              networkVolumeId: { type: "string", default: defaults.networkVolumeId },
              volumeMountPath: { type: "string", default: defaults.volumeMountPath },
              ports: { type: "array", items: { type: "string" }, default: defaults.ports },
              gpuTypeIds: { type: "array", items: { type: "string" }, default: defaults.gpuTypeIds },
            },
          },
        },
      },
      security: [{ adminSessionOrSecret: [] }],
      "x-runpod-defaults": defaults,
    });
  } catch (error: any) {
    const status = error?.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ ok: false, error: error?.message || "Failed to build OpenAPI spec" }, { status });
  }
}

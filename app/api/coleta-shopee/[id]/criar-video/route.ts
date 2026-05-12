import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Agent } from "undici";

const workerHttpAgent = new Agent({
  headersTimeout: 600_000,
  bodyTimeout: 600_000,
  connectTimeout: 30_000,
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  // 1. Buscar coleta + mídias no DB
  const coleta = await prisma.coletaDadosShoppe.findUnique({
    where: { id },
    include: { linksMedia: true },
  });

  if (!coleta) {
    return NextResponse.json({ error: "Coleta não encontrada." }, { status: 404 });
  }

  if (!coleta.linksMedia || coleta.linksMedia.length === 0) {
    return NextResponse.json(
      { error: "Nenhuma mídia coletada. Execute o scraping primeiro." },
      { status: 400 }
    );
  }

  // 2. Extrair o vídeo de reação do multipart recebido
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Envie o vídeo de reação via multipart/form-data." },
      { status: 400 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Falha ao ler o formulário." }, { status: 400 });
  }

  const reactionFile = formData.get("reaction_video") as File | null;
  if (!reactionFile) {
    return NextResponse.json(
      { error: "Campo 'reaction_video' obrigatório." },
      { status: 400 }
    );
  }

  // 3. Marcar como "em renderização" no DB
  await prisma.coletaDadosShoppe.update({
    where: { id },
    data: { videoStatus: "RENDERING" },
  });

  // 4. Montar multipart para o Python Worker
  const workerForm = new FormData();
  workerForm.append("coleta_id", id);
  workerForm.append("media_urls", JSON.stringify(coleta.linksMedia));
  workerForm.append("reaction_video", reactionFile, reactionFile.name);

  // Opções opcionais vindas do frontend
  const pipFraction = formData.get("pip_fraction");
  const pipMargin   = formData.get("pip_margin");
  const pipRadius   = formData.get("pip_radius");
  if (pipFraction) workerForm.append("pip_fraction", String(pipFraction));
  if (pipMargin)   workerForm.append("pip_margin",   String(pipMargin));
  if (pipRadius)   workerForm.append("pip_radius",   String(pipRadius));

  try {
    const baseUrl = (process.env.WORKER_FASTAPI_BASE_URL || process.env.FASTAPI_URL || "http://127.0.0.1:8000")
      .trim()
      .replace(/\/+$/, "")
      .replace(/\/gerar-video$/, "");
    
    const targetUrl = `${baseUrl}/gerar-video-tiktok`;
    const startedAt = Date.now();
    console.log("[criar-video] start", {
      coletaId: id,
      targetUrl,
      mediaCount: coleta.linksMedia.length,
      reactionName: reactionFile.name,
      reactionSize: reactionFile.size,
      pipFraction: pipFraction ? String(pipFraction) : null,
      pipMargin: pipMargin ? String(pipMargin) : null,
      pipRadius: pipRadius ? String(pipRadius) : null,
    });

    const workerRes = await fetch(targetUrl, {
      method: "POST",
      body: workerForm,
      dispatcher: workerHttpAgent,
      signal: AbortSignal.timeout(600_000), // 10 min
    });

    console.log("[criar-video] worker response", {
      coletaId: id,
      status: workerRes.status,
      ok: workerRes.ok,
      elapsedMs: Date.now() - startedAt,
    });

    if (!workerRes.ok) {
      const errText = await workerRes.text();
      console.error("[criar-video] worker error body", {
        coletaId: id,
        elapsedMs: Date.now() - startedAt,
        body: errText,
      });
      throw new Error(`Worker retornou ${workerRes.status}: ${errText}`);
    }

    const result = await workerRes.json();
    const videoUrl: string = result.videoUrl;
    console.log("[criar-video] success", { coletaId: id, elapsedMs: Date.now() - startedAt, videoUrl });

    // 5. Persistir URL no DB
    const updated = await prisma.coletaDadosShoppe.update({
      where: { id },
      data: {
        videoFinalUrl: videoUrl,
        videoStatus: "COMPLETED",
      },
      include: { linksMedia: true },
    });

    return NextResponse.json({ ok: true, videoUrl, coleta: updated });
  } catch (error: any) {
    console.error("[criar-video] Erro detalhado:", {
      coletaId: id,
      message: error?.message || null,
      stack: error?.stack || null,
      cause: error?.cause ? {
        message: error.cause.message || null,
        code: error.cause.code || null,
        name: error.cause.name || null,
      } : null,
    });

    await prisma.coletaDadosShoppe.update({
      where: { id },
      data: { videoStatus: "FAILED" },
    });

    return NextResponse.json(
      { error: error.message || "Falha ao gerar vídeo." },
      { status: 500 }
    );
  }
}

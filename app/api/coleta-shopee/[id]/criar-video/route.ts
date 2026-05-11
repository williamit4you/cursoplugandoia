import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PYTHON_API_URL = process.env.WORKER_FASTAPI_BASE_URL || process.env.FASTAPI_URL || "http://localhost:8000";

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
    const baseUrl = PYTHON_API_URL.replace(/\/gerar-video\/?$/, "");
    const workerRes = await fetch(`${baseUrl}/gerar-video-tiktok`, {
      method: "POST",
      body: workerForm,
      // Renderização pode demorar bastante dependendo da duração
      signal: AbortSignal.timeout(600_000), // 10 min
    });

    if (!workerRes.ok) {
      const errText = await workerRes.text();
      throw new Error(`Worker retornou ${workerRes.status}: ${errText}`);
    }

    const result = await workerRes.json();
    const videoUrl: string = result.videoUrl;

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
    console.error("[criar-video] Erro:", error);

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

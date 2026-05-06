import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// PATCH /api/task-runs/[id] — cancelar uma execução
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const { action } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
    }

    const run = await prisma.automationTaskRun.findUnique({ where: { id } });
    if (!run) {
      return NextResponse.json({ error: "Execução não encontrada" }, { status: 404 });
    }

    if (action === "cancel") {
      // Cancela a execução e todos os steps pendentes/em execução
      await prisma.automationTaskRun.update({
        where: { id },
        data: {
          status: "CANCELED",
          finishedAt: new Date(),
          errorMessage: "Cancelado manualmente pelo usuário",
        },
      });

      await prisma.automationTaskStepRun.updateMany({
        where: {
          taskRunId: id,
          status: { in: ["PENDING", "RUNNING"] },
        },
        data: {
          status: "SKIPPED",
          finishedAt: new Date(),
          errorMessage: "Cancelado manualmente pelo usuário",
        },
      });

      return NextResponse.json({ ok: true, action: "canceled" });
    }

    return NextResponse.json({ error: "Ação inválida. Use: cancel" }, { status: 400 });
  } catch (error: any) {
    console.error("[api/task-runs/[id] PATCH]", error);
    return NextResponse.json(
      { error: error?.message || "Falha ao atualizar execução" },
      { status: 500 }
    );
  }
}

// DELETE /api/task-runs/[id] — excluir uma execução
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
    }

    const run = await prisma.automationTaskRun.findUnique({ where: { id } });
    if (!run) {
      return NextResponse.json({ error: "Execução não encontrada" }, { status: 404 });
    }

    // Steps são deletados em cascata pelo Prisma (onDelete: Cascade)
    await prisma.automationTaskRun.delete({ where: { id } });

    return NextResponse.json({ ok: true, action: "deleted" });
  } catch (error: any) {
    console.error("[api/task-runs/[id] DELETE]", error);
    return NextResponse.json(
      { error: error?.message || "Falha ao excluir execução" },
      { status: 500 }
    );
  }
}

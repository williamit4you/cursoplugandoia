import "server-only";

import { mkdir, readFile, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { prisma } from "@/lib/prisma";

export type RunpodState = {
  currentPodId: string | null;
  updatedAt: string | null;
  lastAction: "ligar" | "ligarnovo" | "desligar" | "sync" | null;
  lastError: string | null;
  pendingPod: boolean;
  pendingSince: string | null;
};

const defaultState: RunpodState = {
  currentPodId: null,
  updatedAt: null,
  lastAction: null,
  lastError: null,
  pendingPod: false,
  pendingSince: null,
};

function stateFilePath() {
  // In many production containers `/app` is read-only. Prefer an OS temp dir there.
  const isProd = process.env.NODE_ENV === "production";
  const baseDir = isProd ? os.tmpdir() : process.cwd();
  return path.join(baseDir, ".cache", "runpod-state.json");
}

async function readStateFromDb(): Promise<Partial<RunpodState> | null> {
  try {
    const session = await prisma.podSession.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { currentPodId: true, pendingPod: true, pendingSince: true, updatedAt: true },
    });

    if (!session) return null;
    return {
      currentPodId: session.currentPodId || null,
      pendingPod: Boolean(session.pendingPod),
      pendingSince: session.pendingSince ? session.pendingSince.toISOString() : null,
      updatedAt: session.updatedAt ? session.updatedAt.toISOString() : null,
    };
  } catch {
    return null;
  }
}

async function writeStateToDb(patch: Partial<RunpodState>) {
  try {
    const current = await prisma.podSession.findFirst({ orderBy: { updatedAt: "desc" }, select: { id: true } });
    const data: any = {};

    if (patch.currentPodId !== undefined) data.currentPodId = patch.currentPodId;
    if (patch.pendingPod !== undefined) data.pendingPod = patch.pendingPod;
    if (patch.pendingSince !== undefined) data.pendingSince = patch.pendingSince ? new Date(patch.pendingSince) : null;

    if (!Object.keys(data).length) return;

    if (current?.id) {
      await prisma.podSession.update({ where: { id: current.id }, data });
    } else {
      await prisma.podSession.create({
        data: {
          status: "OFFLINE" as any,
          ...data,
        },
      });
    }
  } catch {
    // ignore (file fallback will still work)
  }
}

export async function loadRunpodState(): Promise<RunpodState> {
  const dbState = await readStateFromDb();
  if (dbState && (dbState.currentPodId !== undefined || dbState.pendingPod !== undefined || dbState.pendingSince !== undefined)) {
    return {
      ...defaultState,
      ...dbState,
      pendingPod: Boolean(dbState.pendingPod),
      pendingSince: typeof dbState.pendingSince === "string" ? dbState.pendingSince : null,
      updatedAt: typeof dbState.updatedAt === "string" ? dbState.updatedAt : null,
    };
  }

  try {
    const raw = await readFile(stateFilePath(), "utf8");
    const parsed = JSON.parse(raw);
    return {
      currentPodId: typeof parsed?.currentPodId === "string" ? parsed.currentPodId : null,
      updatedAt: typeof parsed?.updatedAt === "string" ? parsed.updatedAt : null,
      lastAction:
        parsed?.lastAction === "ligar" || parsed?.lastAction === "ligarnovo" || parsed?.lastAction === "desligar" || parsed?.lastAction === "sync"
          ? parsed.lastAction
          : null,
      lastError: typeof parsed?.lastError === "string" ? parsed.lastError : null,
      pendingPod: typeof parsed?.pendingPod === "boolean" ? parsed.pendingPod : false,
      pendingSince: typeof parsed?.pendingSince === "string" ? parsed.pendingSince : null,
    };
  } catch {
    return { ...defaultState };
  }
}

export async function saveRunpodState(patch: Partial<RunpodState>) {
  await writeStateToDb(patch);

  const previous = await loadRunpodState();
  const next: RunpodState = {
    ...previous,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  try {
    await mkdir(path.dirname(stateFilePath()), { recursive: true });
    await writeFile(stateFilePath(), JSON.stringify(next, null, 2), "utf8");
  } catch {
    // Ignore filesystem permission issues in production; DB is the source of truth.
  }
  return next;
}

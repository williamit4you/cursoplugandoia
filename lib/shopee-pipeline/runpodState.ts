import "server-only";

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export type RunpodState = {
  currentPodId: string | null;
  updatedAt: string | null;
  lastAction: "ligar" | "ligarnovo" | "desligar" | "sync" | null;
  lastError: string | null;
};

const defaultState: RunpodState = {
  currentPodId: null,
  updatedAt: null,
  lastAction: null,
  lastError: null,
};

function stateFilePath() {
  return path.join(process.cwd(), ".cache", "runpod-state.json");
}

export async function loadRunpodState(): Promise<RunpodState> {
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
    };
  } catch {
    return { ...defaultState };
  }
}

export async function saveRunpodState(patch: Partial<RunpodState>) {
  const previous = await loadRunpodState();
  const next: RunpodState = {
    ...previous,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  await mkdir(path.dirname(stateFilePath()), { recursive: true });
  await writeFile(stateFilePath(), JSON.stringify(next, null, 2), "utf8");
  return next;
}

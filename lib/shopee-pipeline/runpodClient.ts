import "server-only";

import { getRunpodManagerStatus, startOrCreateRunpodPod, stopCurrentRunpodPod } from "@/lib/shopee-pipeline/runpodManager";

export async function runpodOnline(timeoutMs = 8000) {
  const status = await getRunpodManagerStatus();
  return {
    ok: Boolean(status.ok),
    status: status.ok ? 200 : 500,
    data: {
      ok: Boolean(status.online),
      online: Boolean(status.online),
      status: status.online ? "online" : "offline",
      timeoutMs,
      currentPodId: status.currentPodId,
      comfyBaseUrl: status.comfyBaseUrl,
      details: status,
    },
  };
}

export async function runpodPowerOn(params: { esperarOnline: boolean; maxEsperaSegundos: number }, timeoutMs = 20000) {
  const result = await startOrCreateRunpodPod({
    forceCreateNew: false,
    timeoutMs: Math.max(timeoutMs, params.maxEsperaSegundos * 1000),
  });
  return { ok: true, status: 200, data: result };
}

export async function runpodPowerOff(timeoutMs = 20000) {
  const result = await stopCurrentRunpodPod();
  return { ok: true, status: 200, data: { ...result, timeoutMs } };
}

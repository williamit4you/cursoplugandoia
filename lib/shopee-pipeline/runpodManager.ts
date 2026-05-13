import "server-only";

import { prisma } from "@/lib/prisma";
import { loadRunpodState, saveRunpodState } from "@/lib/shopee-pipeline/runpodState";

const RUNPOD_API_BASE_URL = "https://rest.runpod.io/v1";
const DEFAULT_IMAGE_NAME = "willianbarata/comfyui-qwen:v1";
const DEFAULT_NETWORK_VOLUME_ID = "nizgbzbusx";
const DEFAULT_VOLUME_MOUNT_PATH = "/workspace";
const DEFAULT_PORTS = ["8188/http", "22/tcp"];
const DEFAULT_GPU_TYPE_IDS = [
  "NVIDIA RTX A5000",
  "NVIDIA RTX A4500",
  "NVIDIA RTX A4000",
  "NVIDIA A40",
  "NVIDIA RTX A6000",
  "NVIDIA GeForce RTX 4090",
];
const DEFAULT_TIMEOUT_MS = 180_000;
const DEFAULT_POLL_MS = 8_000;
const DEFAULT_CONTAINER_DISK_GB = 50;
const DEFAULT_VOLUME_GB = 40;

type RunpodPod = {
  id: string;
  desiredStatus?: string | null;
  imageName?: string | null;
  image?: string | null;
  lastStatusChange?: string | null;
  machineId?: string | null;
  publicIp?: string | null;
  ports?: string[] | null;
  portMappings?: Record<string, number> | null;
  networkVolume?: { id?: string | null; name?: string | null } | null;
  volumeMountPath?: string | null;
};

type RunpodSessionStatus = "OFFLINE" | "STARTING" | "ONLINE" | "BUSY" | "IDLE" | "STOPPING" | "ERROR";

function runpodApiKey() {
  const value = (process.env.RUNPOD_API_KEY || "").trim();
  if (!value) throw new Error("RUNPOD_API_KEY not configured");
  return value;
}

function splitCsv(value: string | undefined, fallback: string[]) {
  const items = String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : fallback;
}

function runpodConfig() {
  return {
    imageName: (process.env.RUNPOD_IMAGE_NAME || DEFAULT_IMAGE_NAME).trim(),
    networkVolumeId: (process.env.RUNPOD_NETWORK_VOLUME_ID || DEFAULT_NETWORK_VOLUME_ID).trim(),
    volumeMountPath: (process.env.RUNPOD_VOLUME_MOUNT_PATH || DEFAULT_VOLUME_MOUNT_PATH).trim(),
    ports: splitCsv(process.env.RUNPOD_PORTS, DEFAULT_PORTS),
    gpuTypeIds: splitCsv(process.env.RUNPOD_GPU_TYPE_IDS, DEFAULT_GPU_TYPE_IDS),
    dataCenterIds: splitCsv(process.env.RUNPOD_DATA_CENTER_IDS, []),
    countryCodes: splitCsv(process.env.RUNPOD_COUNTRY_CODES, []),
    allowedCudaVersions: splitCsv(process.env.RUNPOD_ALLOWED_CUDA_VERSIONS, []),
    podName: (process.env.RUNPOD_POD_NAME || "Plugando ComfyUI").trim(),
    cloudType: (process.env.RUNPOD_CLOUD_TYPE || "SECURE").trim(),
    gpuCount: Math.max(1, Number(process.env.RUNPOD_GPU_COUNT || 1)),
    minVCPUPerGPU: Math.max(2, Number(process.env.RUNPOD_MIN_VCPU_PER_GPU || 2)),
    minRAMPerGPU: Math.max(8, Number(process.env.RUNPOD_MIN_RAM_PER_GPU || 8)),
    containerDiskInGb: Math.max(20, Number(process.env.RUNPOD_CONTAINER_DISK_GB || DEFAULT_CONTAINER_DISK_GB)),
    volumeInGb: Math.max(20, Number(process.env.RUNPOD_VOLUME_GB || DEFAULT_VOLUME_GB)),
  };
}

async function runpodFetch<T>(pathname: string, init: RequestInit = {}, timeoutMs = 30_000): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(`${RUNPOD_API_BASE_URL}${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${runpodApiKey()}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });

  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data };
}

function comfyProxyUrl(podId: string) {
  return `https://${podId}-8188.proxy.runpod.net`;
}

async function updatePodSession(status: RunpodSessionStatus, patch?: { startedAt?: Date | null; stoppedAt?: Date | null; errorMessage?: string | null }) {
  try {
    const current = await prisma.podSession.findFirst({ orderBy: { updatedAt: "desc" } });
    const data = {
      status: status as any,
      lastOnlineCheckAt: new Date(),
      lastActivityAt: status === "ONLINE" || status === "IDLE" || status === "BUSY" ? new Date() : undefined,
      startedAt: patch?.startedAt,
      stoppedAt: patch?.stoppedAt,
      errorMessage: patch?.errorMessage ?? null,
    };

    if (current) {
      return prisma.podSession.update({ where: { id: current.id }, data });
    }

    return prisma.podSession.create({ data });
  } catch (error: any) {
    console.warn("[runpodManager] podSession sync skipped:", error?.message || error);
    return null;
  }
}

async function getLatestPodSession() {
  try {
    return await prisma.podSession.findFirst({ orderBy: { updatedAt: "desc" } });
  } catch (error: any) {
    console.warn("[runpodManager] podSession read skipped:", error?.message || error);
    return null;
  }
}

async function getPod(podId: string, timeoutMs = 15_000) {
  const res = await runpodFetch<RunpodPod>(`/pods/${encodeURIComponent(podId)}`, { method: "GET" }, timeoutMs);
  if (!res.ok) {
    throw new Error(`Runpod pod lookup failed (HTTP ${res.status})`);
  }
  return res.data;
}

async function startPod(podId: string, timeoutMs = 15_000) {
  const res = await runpodFetch(`/pods/${encodeURIComponent(podId)}/start`, { method: "POST" }, timeoutMs);
  if (!res.ok) {
    throw new Error(`Runpod pod start failed (HTTP ${res.status})`);
  }
  return res.data;
}

async function stopPod(podId: string, timeoutMs = 15_000) {
  const res = await runpodFetch(`/pods/${encodeURIComponent(podId)}/stop`, { method: "POST" }, timeoutMs);
  if (!res.ok) {
    throw new Error(`Runpod pod stop failed (HTTP ${res.status})`);
  }
  return res.data;
}

async function createPod(timeoutMs = 30_000) {
  const cfg = runpodConfig();
  const body: Record<string, unknown> = {
    name: cfg.podName,
    imageName: cfg.imageName,
    cloudType: cfg.cloudType,
    computeType: "GPU",
    gpuCount: cfg.gpuCount,
    gpuTypeIds: cfg.gpuTypeIds,
    gpuTypePriority: "availability",
    networkVolumeId: cfg.networkVolumeId,
    volumeMountPath: cfg.volumeMountPath,
    ports: cfg.ports,
    containerDiskInGb: cfg.containerDiskInGb,
    volumeInGb: cfg.volumeInGb,
    minVCPUPerGPU: cfg.minVCPUPerGPU,
    minRAMPerGPU: cfg.minRAMPerGPU,
    supportPublicIp: true,
  };

  if (cfg.dataCenterIds.length) body.dataCenterIds = cfg.dataCenterIds;
  if (cfg.countryCodes.length) body.countryCodes = cfg.countryCodes;
  if (cfg.allowedCudaVersions.length) body.allowedCudaVersions = cfg.allowedCudaVersions;

  const res = await runpodFetch<RunpodPod>("/pods", { method: "POST", body: JSON.stringify(body) }, timeoutMs);
  if (!res.ok) {
    throw new Error(`Runpod pod create failed (HTTP ${res.status})`);
  }
  return res.data;
}

async function checkComfyHealth(podId: string, timeoutMs = 8_000) {
  try {
    const res = await fetch(`${comfyProxyUrl(podId)}/system_stats`, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    return { ok: res.ok, status: res.status };
  } catch (error: any) {
    return { ok: false, status: 0, error: error?.message || "comfy health failed" };
  }
}

async function waitUntilRunning(podId: string, timeoutMs = DEFAULT_TIMEOUT_MS, pollMs = DEFAULT_POLL_MS) {
  const startedAt = Date.now();
  let lastPod: RunpodPod | null = null;
  let lastComfy: any = null;

  while (Date.now() - startedAt < timeoutMs) {
    lastPod = await getPod(podId, 15_000);

    if (lastPod.desiredStatus === "TERMINATED") {
      throw new Error(`Pod ${podId} terminated before becoming ready`);
    }

    if (lastPod.desiredStatus === "RUNNING") {
      lastComfy = await checkComfyHealth(podId, 8_000);
      if (lastComfy.ok) {
        return {
          pod: lastPod,
          ready: true,
          comfyBaseUrl: comfyProxyUrl(podId),
          comfyHealth: lastComfy,
        };
      }
    }

    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }

  throw new Error(
    `Timeout waiting pod ${podId} to be ready (desiredStatus=${lastPod?.desiredStatus || "unknown"}, comfy=${lastComfy?.status || "unreachable"})`
  );
}

export async function getCurrentComfyBaseUrl() {
  const override = (process.env.COMFYUI_BASE_URL || "").trim().replace(/\/+$/, "");
  if (override) return override;

  const state = await loadRunpodState();
  if (!state.currentPodId) throw new Error("No current Runpod pod configured");
  return comfyProxyUrl(state.currentPodId);
}

export async function getRunpodManagerStatus() {
  const state = await loadRunpodState();
  const session = await getLatestPodSession();

  if (!state.currentPodId) {
    return {
      ok: true,
      online: false,
      currentPodId: null,
      session,
      state,
      pod: null,
      comfyBaseUrl: null,
      comfyHealth: null,
    };
  }

  try {
    const pod = await getPod(state.currentPodId, 15_000);
    const comfyHealth = pod.desiredStatus === "RUNNING" ? await checkComfyHealth(state.currentPodId, 5_000) : null;
    const online = pod.desiredStatus === "RUNNING" && Boolean(comfyHealth?.ok);

    await updatePodSession(online ? "ONLINE" : pod.desiredStatus === "RUNNING" ? "IDLE" : "OFFLINE");
    await saveRunpodState({ lastAction: "sync", lastError: null });

    return {
      ok: true,
      online,
      currentPodId: state.currentPodId,
      session: await getLatestPodSession(),
      state: await loadRunpodState(),
      pod,
      comfyBaseUrl: comfyProxyUrl(state.currentPodId),
      comfyHealth,
    };
  } catch (error: any) {
    await updatePodSession("ERROR", { errorMessage: error?.message || "runpod status failed" });
    await saveRunpodState({ lastError: error?.message || "runpod status failed" });
    return {
      ok: false,
      online: false,
      currentPodId: state.currentPodId,
      session: await getLatestPodSession(),
      state: await loadRunpodState(),
      pod: null,
      comfyBaseUrl: comfyProxyUrl(state.currentPodId),
      comfyHealth: null,
      error: error?.message || "runpod status failed",
    };
  }
}

export async function startOrCreateRunpodPod(params?: { forceCreateNew?: boolean; timeoutMs?: number }) {
  const forceCreateNew = Boolean(params?.forceCreateNew);
  const timeoutMs = Math.max(30_000, Number(params?.timeoutMs || DEFAULT_TIMEOUT_MS));
  const state = await loadRunpodState();
  const logs: string[] = [];

  await updatePodSession("STARTING");

  if (state.currentPodId && !forceCreateNew) {
    logs.push(`Trying to start saved pod ${state.currentPodId}`);
    try {
      await startPod(state.currentPodId, 15_000);
      const ready = await waitUntilRunning(state.currentPodId, timeoutMs, DEFAULT_POLL_MS);
      await saveRunpodState({ currentPodId: state.currentPodId, lastAction: "ligar", lastError: null });
      await updatePodSession("ONLINE", { startedAt: new Date() });
      return {
        ok: true,
        action: "ligar",
        reusedExistingPod: true,
        currentPodId: state.currentPodId,
        comfyBaseUrl: ready.comfyBaseUrl,
        pod: ready.pod,
        logs,
      };
    } catch (error: any) {
      logs.push(`Saved pod ${state.currentPodId} failed to start: ${error?.message || "unknown error"}`);
    }
  }

  logs.push(forceCreateNew ? "Creating a brand new pod by request" : "Creating a replacement pod");
  const created = await createPod(30_000);
  const ready = await waitUntilRunning(created.id, timeoutMs, DEFAULT_POLL_MS);

  await saveRunpodState({
    currentPodId: created.id,
    lastAction: forceCreateNew ? "ligarnovo" : "ligar",
    lastError: null,
  });
  await updatePodSession("ONLINE", { startedAt: new Date() });

  return {
    ok: true,
    action: forceCreateNew ? "ligarnovo" : "ligar",
    reusedExistingPod: false,
    replacedPreviousPodId: state.currentPodId,
    currentPodId: created.id,
    comfyBaseUrl: ready.comfyBaseUrl,
    pod: ready.pod,
    logs,
  };
}

export async function stopCurrentRunpodPod() {
  const state = await loadRunpodState();
  if (!state.currentPodId) {
    await updatePodSession("OFFLINE");
    return {
      ok: true,
      action: "desligar",
      stopped: false,
      reason: "No currentPodId saved",
    };
  }

  await updatePodSession("STOPPING");
  await stopPod(state.currentPodId, 15_000);
  await saveRunpodState({ lastAction: "desligar", lastError: null });
  await updatePodSession("OFFLINE", { stoppedAt: new Date() });

  return {
    ok: true,
    action: "desligar",
    stopped: true,
    currentPodId: state.currentPodId,
  };
}

export function getRunpodManagerDefaults() {
  const cfg = runpodConfig();
  return {
    imageName: cfg.imageName,
    networkVolumeId: cfg.networkVolumeId,
    volumeMountPath: cfg.volumeMountPath,
    ports: cfg.ports,
    gpuTypeIds: cfg.gpuTypeIds,
    podName: cfg.podName,
    cloudType: cfg.cloudType,
    gpuCount: cfg.gpuCount,
    minVCPUPerGPU: cfg.minVCPUPerGPU,
    minRAMPerGPU: cfg.minRAMPerGPU,
    containerDiskInGb: cfg.containerDiskInGb,
    volumeInGb: cfg.volumeInGb,
    dataCenterIds: cfg.dataCenterIds,
    countryCodes: cfg.countryCodes,
    allowedCudaVersions: cfg.allowedCudaVersions,
  };
}

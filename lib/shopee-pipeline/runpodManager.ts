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

type RunpodManagerStep = "START" | "POLL" | "CREATE" | "VERIFY" | "LOCK";

type RunpodManagerEvent = {
  at: string;
  step: RunpodManagerStep;
  attempt: number;
  podId?: string | null;
  elapsedMs: number;
  message: string;
  details?: any;
};

class RunpodHttpError extends Error {
  status: number;
  data: any;
  request?: any;
  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = "RunpodHttpError";
    this.status = status;
    this.data = data;
  }
}

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

function truncateText(value: unknown, maxLen = 8000) {
  const text = typeof value === "string" ? value : value == null ? "" : String(value);
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen)}…(truncado)`;
}

async function runpodFetch<T>(
  pathname: string,
  init: RequestInit = {},
  timeoutMs = 30_000
): Promise<{
  ok: boolean;
  status: number;
  data: T;
  request: { method: string; url: string; path: string; body: string | null };
  elapsedMs: number;
}> {
  const startedAt = Date.now();
  const method = String((init.method || "GET").toUpperCase());
  const body = typeof init.body === "string" ? truncateText(init.body, 12000) : null;
  const url = `${RUNPOD_API_BASE_URL}${pathname}`;
  const res = await fetch(url, {
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
  return {
    ok: res.ok,
    status: res.status,
    data,
    request: { method, url, path: pathname, body },
    elapsedMs: Date.now() - startedAt,
  };
}

function comfyProxyUrl(podId: string) {
  return `https://${podId}-8188.proxy.runpod.net`;
}

function formatPodName(baseName: string) {
  const d = new Date();
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const ts = `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
  const safe = baseName.trim() || "comfyui-auto";
  return `${safe}-${ts}`;
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
    const err = new RunpodHttpError(`Runpod pod lookup failed`, res.status, res.data);
    err.request = { ...res.request, elapsedMs: res.elapsedMs };
    throw err;
  }
  return { pod: res.data, http: { request: { ...res.request, elapsedMs: res.elapsedMs }, response: { status: res.status, data: res.data } } };
}

async function startPod(podId: string, timeoutMs = 15_000) {
  const res = await runpodFetch(`/pods/${encodeURIComponent(podId)}/start`, { method: "POST" }, timeoutMs);
  if (!res.ok) {
    const err = new RunpodHttpError(`Runpod pod start failed`, res.status, res.data);
    err.request = { ...res.request, elapsedMs: res.elapsedMs };
    throw err;
  }
  return { data: res.data, http: { request: { ...res.request, elapsedMs: res.elapsedMs }, response: { status: res.status, data: res.data } } };
}

async function stopPod(podId: string, timeoutMs = 15_000) {
  const res = await runpodFetch(`/pods/${encodeURIComponent(podId)}/stop`, { method: "POST" }, timeoutMs);
  if (!res.ok) {
    const err = new RunpodHttpError(`Runpod pod stop failed`, res.status, res.data);
    err.request = { ...res.request, elapsedMs: res.elapsedMs };
    throw err;
  }
  return { data: res.data, http: { request: { ...res.request, elapsedMs: res.elapsedMs }, response: { status: res.status, data: res.data } } };
}

async function createPod(params: { timeoutMs?: number; podNameOverride?: string } = {}) {
  const timeoutMs = Math.max(10_000, Number(params.timeoutMs || 30_000));
  const cfg = runpodConfig();
  const body: Record<string, unknown> = {
    name: (params.podNameOverride || cfg.podName).trim(),
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
    const err = new RunpodHttpError(`Runpod pod create failed`, res.status, res.data);
    err.request = { ...res.request, elapsedMs: res.elapsedMs };
    throw err;
  }
  return { pod: res.data, http: { request: { ...res.request, elapsedMs: res.elapsedMs }, response: { status: res.status, data: res.data } } };
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
    const fetched = await getPod(podId, 15_000);
    lastPod = fetched.pod;

    if (lastPod.desiredStatus === "TERMINATED" || lastPod.desiredStatus === "EXITED" || lastPod.desiredStatus === "FAILED") {
      throw new Error(`Pod ${podId} failed before becoming ready (desiredStatus=${lastPod.desiredStatus})`);
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

async function tryAcquireRunpodLock() {
  try {
    const rows = (await prisma.$queryRaw`SELECT pg_try_advisory_lock(901231, 77) AS locked`) as Array<{ locked: boolean }>;
    return Boolean(rows?.[0]?.locked);
  } catch (error: any) {
    console.warn("[runpodManager] advisory lock unavailable:", error?.message || error);
    return false;
  }
}

async function releaseRunpodLock() {
  try {
    await prisma.$queryRaw`SELECT pg_advisory_unlock(901231, 77)`;
  } catch (error: any) {
    console.warn("[runpodManager] advisory unlock failed:", error?.message || error);
  }
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
    const comfyHealth = pod.pod.desiredStatus === "RUNNING" ? await checkComfyHealth(state.currentPodId, 5_000) : null;
    const online = pod.pod.desiredStatus === "RUNNING" && Boolean(comfyHealth?.ok);

    await updatePodSession(online ? "ONLINE" : pod.pod.desiredStatus === "RUNNING" ? "IDLE" : "OFFLINE");
    await saveRunpodState({ lastAction: "sync", lastError: null, pendingPod: online ? false : state.pendingPod });

    return {
      ok: true,
      online,
      currentPodId: state.currentPodId,
      session: await getLatestPodSession(),
      state: await loadRunpodState(),
      pod: pod.pod,
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
  const timeoutMs = Math.max(180_000, Number(params?.timeoutMs || DEFAULT_TIMEOUT_MS));
  const pollMs = Math.max(5_000, Math.min(10_000, Number(process.env.RUNPOD_POLL_MS || DEFAULT_POLL_MS)));
  const createdNameBase = (process.env.RUNPOD_POD_NAME || "comfyui-auto").trim();
  const startedAt = Date.now();
  const events: RunpodManagerEvent[] = [];

  const pushEvent = (evt: Omit<RunpodManagerEvent, "at" | "elapsedMs">) => {
    events.push({
      ...evt,
      at: new Date().toISOString(),
      elapsedMs: Date.now() - startedAt,
    });
  };

  const locked = await tryAcquireRunpodLock();
  pushEvent({ step: "LOCK", attempt: 1, message: locked ? "Lock adquirido (evita criar 2 pods em paralelo)" : "Sem lock (seguindo com modo seguro/aguardar)" });

  try {
    const state = await loadRunpodState();
    await updatePodSession("STARTING");

    if (!locked) {
      if (!state.currentPodId) {
        return {
          ok: false,
          action: forceCreateNew ? "ligarnovo" : "ligar",
          status: "ERROR",
          currentPodId: null,
          events,
          error: "Outro processo está controlando o Runpod e não há currentPodId salvo",
        };
      }

      pushEvent({ step: "POLL", attempt: 1, podId: state.currentPodId, message: "Lock não adquirido; aguardando pod atual ficar pronto" });
      try {
        const ready = await waitUntilRunning(state.currentPodId, timeoutMs, pollMs);
        await saveRunpodState({ currentPodId: state.currentPodId, lastAction: "sync", lastError: null, pendingPod: false, pendingSince: null });
        await updatePodSession("ONLINE", { startedAt: new Date() });
        pushEvent({ step: "VERIFY", attempt: 1, podId: state.currentPodId, message: "Pod RUNNING e ComfyUI saudável" });
        return {
          ok: true,
          action: "ligar",
          status: "RUNNING",
          reusedExistingPod: true,
          currentPodId: state.currentPodId,
          connectUrl: ready.comfyBaseUrl,
          comfyBaseUrl: ready.comfyBaseUrl,
          pod: ready.pod,
          events,
        };
      } catch (error: any) {
        pushEvent({
          step: "POLL",
          attempt: 1,
          podId: state.currentPodId,
          message: "Pod ainda não ficou pronto (lock está com outro processo)",
          details: { message: error?.message || error },
        });
        return {
          ok: false,
          action: "ligar",
          status: "STARTING",
          reusedExistingPod: true,
          currentPodId: state.currentPodId,
          connectUrl: comfyProxyUrl(state.currentPodId),
          events,
          error: error?.message || "Pod ainda não ficou pronto",
        };
      }
    }

    if (state.currentPodId && !forceCreateNew) {
      const podId = state.currentPodId;
      pushEvent({ step: "START", attempt: 1, podId, message: "Tentando dar START no pod salvo" });
      let startIssued = false;

      try {
        const started = await startPod(podId, 15_000);
        startIssued = true;
        pushEvent({ step: "START", attempt: 1, podId, message: "START enviado com sucesso", details: { http: started.http } });
      } catch (error: any) {
        pushEvent({
          step: "START",
          attempt: 1,
          podId,
          message: "START falhou; fazendo fallback para CREATE",
          details:
            error instanceof RunpodHttpError
              ? { http: { request: error.request || null, response: { status: error.status, data: error.data } }, message: error.message }
              : { message: error?.message || error },
        });
        // Fall through to CREATE.
      }

      if (startIssued) {
        pushEvent({ step: "POLL", attempt: 1, podId, message: "Aguardando pod ficar RUNNING (e ComfyUI saudável)" });
        try {
          const ready = await waitUntilRunning(podId, timeoutMs, pollMs);
          await saveRunpodState({ currentPodId: podId, lastAction: "ligar", lastError: null, pendingPod: false, pendingSince: null });
          await updatePodSession("ONLINE", { startedAt: new Date() });
          pushEvent({ step: "VERIFY", attempt: 1, podId, message: "Pod RUNNING e ComfyUI saudável" });
          return {
            ok: true,
            action: "ligar",
            status: "RUNNING",
            reusedExistingPod: true,
            currentPodId: podId,
            connectUrl: ready.comfyBaseUrl,
            comfyBaseUrl: ready.comfyBaseUrl,
            pod: ready.pod,
            events,
          };
        } catch (error: any) {
          pushEvent({
            step: "POLL",
            attempt: 1,
            podId,
            message: "POLL falhou/timeout; fazendo fallback para CREATE",
            details: { message: error?.message || error },
          });
        }
      }
    }

    const attempt = 1;
    const podName = formatPodName(createdNameBase);
    pushEvent({ step: "CREATE", attempt, message: "Criando pod novo", details: { podName } });

    let created: { pod: RunpodPod; http: any };
    try {
      created = await createPod({ timeoutMs: 30_000, podNameOverride: podName });
      pushEvent({
        step: "CREATE",
        attempt,
        podId: created.pod.id,
        message: "CREATE ok",
        details: {
          podName,
          http: created.http,
          result: {
            id: created.pod.id,
            desiredStatus: created.pod.desiredStatus,
            imageName: created.pod.imageName,
            networkVolume: created.pod.networkVolume,
          },
        },
      });
    } catch (error: any) {
      pushEvent({
        step: "CREATE",
        attempt,
        message: "CREATE falhou",
        details:
          error instanceof RunpodHttpError
            ? { http: { request: error.request || null, response: { status: error.status, data: error.data } }, message: error.message }
            : { message: error?.message || error },
      });
      await updatePodSession("ERROR", { errorMessage: error?.message || "runpod create failed" });
      await saveRunpodState({ lastError: error?.message || "runpod create failed" });
      return { ok: false, action: forceCreateNew ? "ligarnovo" : "ligar", status: "ERROR", currentPodId: state.currentPodId, events, error: error?.message || "runpod create failed" };
    }

    // Persist immediately (pending) to avoid duplicate creates on retries.
    await saveRunpodState({
      currentPodId: created.pod.id,
      lastAction: forceCreateNew ? "ligarnovo" : "ligar",
      lastError: null,
      pendingPod: true,
      pendingSince: new Date().toISOString(),
    });

    pushEvent({ step: "POLL", attempt, podId: created.pod.id, message: "Aguardando pod novo ficar RUNNING (e ComfyUI saudável)" });
    try {
      const ready = await waitUntilRunning(created.pod.id, timeoutMs, pollMs);
      await saveRunpodState({ currentPodId: created.pod.id, lastAction: forceCreateNew ? "ligarnovo" : "ligar", lastError: null, pendingPod: false, pendingSince: null });
      await updatePodSession("ONLINE", { startedAt: new Date() });
      pushEvent({ step: "VERIFY", attempt, podId: created.pod.id, message: "Pod RUNNING e ComfyUI saudável" });
      return {
        ok: true,
        action: forceCreateNew ? "ligarnovo" : "ligar",
        status: "RUNNING",
        reusedExistingPod: false,
        replacedPreviousPodId: state.currentPodId,
        currentPodId: created.pod.id,
        connectUrl: ready.comfyBaseUrl,
        comfyBaseUrl: ready.comfyBaseUrl,
        pod: ready.pod,
        events,
      };
    } catch (error: any) {
      pushEvent({
        step: "POLL",
        attempt,
        podId: created.pod.id,
        message: "POLL falhou/timeout; pod segue pendente",
        details: { message: error?.message || error },
      });
      await updatePodSession("STARTING", { errorMessage: error?.message || "waiting pod" });
      await saveRunpodState({ lastError: error?.message || "waiting pod" });
      return {
        ok: false,
        action: forceCreateNew ? "ligarnovo" : "ligar",
        status: "STARTING",
        reusedExistingPod: false,
        replacedPreviousPodId: state.currentPodId,
        currentPodId: created.pod.id,
        connectUrl: comfyProxyUrl(created.pod.id),
        events,
        error: error?.message || "Timeout waiting pod",
      };
    }
  } finally {
    if (locked) await releaseRunpodLock();
  }
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

import "server-only";

type RunpodOnlineResponse = {
  ok?: boolean;
  online?: boolean;
  status?: string;
};

function baseUrl() {
  return (process.env.RUNPOD_POWER_API_BASE_URL || "https://frontend-ligadesligapod.xclkv8.easypanel.host")
    .trim()
    .replace(/\/+$/, "");
}

async function fetchJson(url: string, init: RequestInit, timeoutMs: number) {
  const res = await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(timeoutMs) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function runpodOnline(timeoutMs = 8000) {
  return fetchJson(`${baseUrl()}/api/online`, { method: "GET" }, timeoutMs);
}

export async function runpodPowerOn(params: { esperarOnline: boolean; maxEsperaSegundos: number }, timeoutMs = 20000) {
  return fetchJson(
    `${baseUrl()}/api/ligar`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    },
    timeoutMs
  );
}

export async function runpodPowerOff(timeoutMs = 20000) {
  return fetchJson(
    `${baseUrl()}/api/desligar`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    },
    timeoutMs
  );
}


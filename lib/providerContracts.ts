export function validateProviderResponse(provider: "META" | "YOUTUBE" | "STORAGE" | "WORKER", payload: any) {
  const errors: string[] = [];
  if (!payload || typeof payload !== "object") errors.push("Resposta ausente ou invalida");
  if (provider === "META" && !payload?.id && !payload?.creation_id && !payload?.status_code) errors.push("Meta sem id, creation_id ou status_code");
  if (provider === "YOUTUBE" && !payload?.id && !payload?.videoId) errors.push("YouTube sem id do video");
  if (provider === "STORAGE" && !payload?.url && !payload?.Location && !payload?.Key) errors.push("Storage sem URL ou chave do objeto");
  if (provider === "WORKER" && !payload?.jobId && !payload?.id && !payload?.status) errors.push("Worker sem jobId, id ou status");
  return { ok: errors.length === 0, errors };
}

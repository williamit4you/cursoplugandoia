import http from "http";
import https from "https";

export type WorkerHttpResponse = {
  status: number;
  ok: boolean;
  headers: Record<string, string | string[] | undefined>;
  body: Buffer;
};

export async function postMultipartWithoutUndici(url: string, formData: FormData): Promise<WorkerHttpResponse> {
  const requestPayload = new Request(url, {
    method: "POST",
    body: formData,
  });

  const body = Buffer.from(await requestPayload.arrayBuffer());
  const contentType = requestPayload.headers.get("content-type") || "multipart/form-data";
  const parsedUrl = new URL(url);
  const transport = parsedUrl.protocol === "https:" ? https : http;

  return await new Promise((resolve, reject) => {
    const req = transport.request(
      {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        method: "POST",
        headers: {
          "content-type": contentType,
          "content-length": String(body.length),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        res.on("end", () => {
          resolve({
            status: res.statusCode || 500,
            ok: (res.statusCode || 500) >= 200 && (res.statusCode || 500) < 300,
            headers: res.headers,
            body: Buffer.concat(chunks),
          });
        });
      }
    );

    req.setTimeout(0);
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

export function resolveWorkerBaseUrl() {
  return String(process.env.WORKER_FASTAPI_BASE_URL || process.env.FASTAPI_URL || "http://127.0.0.1:8000")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/gerar-video$/, "");
}

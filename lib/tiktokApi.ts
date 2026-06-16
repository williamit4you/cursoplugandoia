import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { spawn } from "child_process";

type TikTokPublishSettings = {
  accessToken?: string | null;
  sessionId?: string | null;
};

type TikTokPublishResult = {
  publishId: string;
  method: "official" | "browser";
};

function getTikTokUploadMethod() {
  const raw = (process.env.TIKTOK_UPLOAD_METHOD || "browser").toLowerCase();
  if (raw === "official" || raw === "browser" || raw === "auto") return raw;
  return "browser";
}

async function publishViaOfficialApi(
  videoUrl: string,
  title: string,
  accessToken: string
): Promise<TikTokPublishResult> {
  const res = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      post_info: {
        title: title.slice(0, 150),
        privacy_level: "PUBLIC_TO_EVERYONE",
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 1000,
      },
      source_info: {
        source: "PULL_FROM_URL",
        video_url: videoUrl,
      },
    }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const apiMessage =
      data?.error?.message || data?.message || `HTTP ${res.status} ${res.statusText}`;
    throw new Error(`TikTok API error: ${apiMessage}`);
  }

  if (data?.error?.code && data.error.code !== "ok") {
    throw new Error(`TikTok API error: ${data.error.message || data.error.code}`);
  }

  return {
    publishId: data?.data?.publish_id || "pending",
    method: "official",
  };
}

function sanitizeFileName(input: string) {
  return input.replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 40) || "tiktok";
}

async function downloadVideoToTemp(videoUrl: string, title: string) {
  const res = await fetch(videoUrl);
  if (!res.ok) {
    throw new Error(`Falha ao baixar o video para upload no navegador: HTTP ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "tiktok-upload-"));
  const videoPath = path.join(tempDir, `${sanitizeFileName(title)}.mp4`);
  await fs.writeFile(videoPath, buffer);
  return { tempDir, videoPath };
}

async function createCookiesFile(tempDir: string, sessionId: string) {
  const cookiesPath = path.join(tempDir, "cookies.txt");
  const cookiesContent = [
    "# Netscape HTTP Cookie File",
    `.tiktok.com\tTRUE\t/\tFALSE\t2147483647\tsessionid\t${sessionId}`,
    "",
  ].join("\n");
  await fs.writeFile(cookiesPath, cookiesContent, "utf8");
  return cookiesPath;
}

async function runUploaderCli(videoPath: string, description: string, cookiesPath: string) {
  const command = process.env.TIKTOK_UPLOADER_COMMAND || "tiktok-uploader";
  const browser = process.env.TIKTOK_UPLOADER_BROWSER || "chrome";
  const headless = (process.env.TIKTOK_UPLOADER_HEADLESS || "true").toLowerCase() !== "false";
  const cwd = process.env.TIKTOK_UPLOADER_WORKDIR || process.cwd();

  const args = ["-v", videoPath, "-d", description.slice(0, 2200), "-c", cookiesPath];
  if (headless) args.push("--headless");

  return await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      shell: true,
      env: {
        ...process.env,
        TIKTOK_UPLOADER_BROWSER: browser,
      },
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      reject(
        new Error(
          `Nao foi possivel iniciar o uploader do TikTok (${command}): ${error.message}`
        )
      );
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      const details = (stderr || stdout || "").trim();
      reject(
        new Error(
          `Uploader do TikTok falhou com codigo ${code}${details ? `: ${details}` : ""}`
        )
      );
    });
  });
}

async function publishViaBrowserUploader(
  videoUrl: string,
  title: string,
  sessionId: string
): Promise<TikTokPublishResult> {
  const { tempDir, videoPath } = await downloadVideoToTemp(videoUrl, title);

  try {
    const cookiesPath = await createCookiesFile(tempDir, sessionId);
    const { stdout } = await runUploaderCli(videoPath, title, cookiesPath);

    return {
      publishId: `browser:${Date.now()}`,
      method: "browser",
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

export async function publishTikTokVideo(
  videoUrl: string,
  title: string,
  settings: TikTokPublishSettings
): Promise<TikTokPublishResult> {
  const method = getTikTokUploadMethod();
  const accessToken = settings.accessToken?.trim();
  const sessionId = settings.sessionId?.trim();
  const officialErrorMessages: string[] = [];

  if ((method === "browser" || method === "auto") && sessionId) {
    try {
      return await publishViaBrowserUploader(videoUrl, title, sessionId);
    } catch (error: any) {
      if (method === "browser") throw error;
    }
  }

  if ((method === "official" || method === "auto") && accessToken) {
    try {
      return await publishViaOfficialApi(videoUrl, title, accessToken);
    } catch (error: any) {
      if (method === "official") throw error;
      officialErrorMessages.push(error?.message || "Falha desconhecida na API oficial.");
    }
  }

  if (method === "official") {
    throw new Error("TikTok oficial configurado sem access token valido.");
  }

  if (method === "browser") {
    throw new Error("TikTok uploader configurado sem sessionid. Salve o Session ID na integracao.");
  }

  if (officialErrorMessages.length > 0) {
    throw new Error(
      `Falha na API oficial e sem fallback configurado: ${officialErrorMessages.join(" | ")}`
    );
  }

  throw new Error(
    "TikTok nao configurado. Informe um sessionid para o uploader ou, opcionalmente, um access token para a API oficial."
  );
}

import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { spawn } from "child_process";
import { sync as whichSync } from "which";

type TikTokPublishSettings = {
  accessToken?: string | null;
  sessionId?: string | null;
};

type TikTokProgressEvent = {
  level: "info" | "success" | "error";
  message: string;
};

type TikTokPublishOptions = {
  onProgress?: (event: TikTokProgressEvent) => void | Promise<void>;
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

function looksLikeCookiesFile(input: string) {
  const value = input.trim();
  return (
    value.includes("\n") ||
    value.includes("\r") ||
    value.includes("\t") ||
    value.includes("# Netscape HTTP Cookie File") ||
    value.includes("sessionid\t") ||
    value.includes("sessionid_ss\t")
  );
}

async function createCookiesFile(tempDir: string, authValue: string) {
  const cookiesPath = path.join(tempDir, "cookies.txt");
  const trimmed = authValue.trim();

  const cookiesContent = looksLikeCookiesFile(trimmed)
    ? trimmed
    : [
        "# Netscape HTTP Cookie File",
        `.tiktok.com\tTRUE\t/\tFALSE\t2147483647\tsessionid\t${trimmed}`,
        `.tiktok.com\tTRUE\t/\tFALSE\t2147483647\tsessionid_ss\t${trimmed}`,
        "",
      ].join("\n");

  await fs.writeFile(cookiesPath, cookiesContent, "utf8");
  return cookiesPath;
}

function resolvePythonCommand() {
  const configured = process.env.TIKTOK_UPLOADER_PYTHON_COMMAND?.trim();
  const candidates = configured ? [configured] : ["python3", "python"];

  for (const candidate of candidates) {
    try {
      whichSync(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  throw new Error(
    "Python nao encontrado no servidor. Instale python3 para usar o uploader do TikTok."
  );
}

function resolveOptionalCommand(command: string) {
  try {
    return whichSync(command);
  } catch {
    return null;
  }
}

async function runUploaderCli(
  tempDir: string,
  videoPath: string,
  description: string,
  authValue: string,
  options?: TikTokPublishOptions
) {
  const configuredCommand = (process.env.TIKTOK_UPLOADER_COMMAND || "tiktok-uploader").trim();
  const browser = (process.env.TIKTOK_UPLOADER_BROWSER || "chromium").trim() || "chromium";
  const headless = (process.env.TIKTOK_UPLOADER_HEADLESS || "true").toLowerCase() !== "false";
  const cwd = process.env.TIKTOK_UPLOADER_WORKDIR || process.cwd();
  const chromiumExecutablePath =
    (process.env.TIKTOK_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium").trim() ||
    "/usr/bin/chromium";

  const cookiesPath = await createCookiesFile(tempDir, authValue);
  const usePythonRunner = configuredCommand === "" || configuredCommand === "tiktok-uploader";
  const baseCommand = usePythonRunner ? resolvePythonCommand() : configuredCommand;

  const baseArgs = usePythonRunner
    ? [
        path.join(tempDir, "tiktok-upload-runner.py"),
        videoPath,
        description.slice(0, 2200),
        cookiesPath,
        browser,
        headless ? "true" : "false",
        chromiumExecutablePath,
      ]
    : ["-v", videoPath, "-d", description.slice(0, 2200), "-c", cookiesPath];

  if (!usePythonRunner && headless) baseArgs.push("--headless");

  if (usePythonRunner) {
    const runnerScript = [
      "import sys",
      "import time",
      "from playwright.sync_api import sync_playwright",
      "from tiktok_uploader import config",
      "from tiktok_uploader.auth import AuthBackend",
      "import tiktok_uploader.upload as upload_module",
      "from tiktok_uploader.upload import complete_upload_form",
      "",
      "video_path, description, cookies_path, browser, headless_raw, executable_path = sys.argv[1:7]",
      "headless = headless_raw.lower() == 'true'",
      "",
      "def _robust_post_video(page):",
      "    candidates = [",
      "        'button[data-e2e=\"post_video_button\"]',",
      "        'button[data-e2e=\"publish-button\"]',",
      "        'button:has-text(\"Post\")',",
      "        'button:has-text(\"Publish\")',",
      "        '.TUXButton--primary',",
      "        '[class*=\"Button\"][class*=\"primary\"]',",
      "    ]",
      "",
      "    for selector in candidates:",
      "        try:",
      "            locator = page.locator(selector).first",
      "            if locator.count() > 0 and locator.is_visible():",
      "                locator.click(timeout=5000)",
      "                return",
      "        except Exception:",
      "            pass",
      "",
      "    try:",
      "        page.get_by_role('button', name='Post').click(timeout=5000)",
      "        return",
      "    except Exception:",
      "        pass",
      "",
      "    try:",
      "        page.get_by_role('button', name='Publish').click(timeout=5000)",
      "        return",
      "    except Exception:",
      "        pass",
      "",
      "    clicked = page.evaluate(\"\"\"",
      "(() => {",
      "  const buttons = Array.from(document.querySelectorAll('button, div[role=\"button\"]'));",
      "  const target = buttons.find((el) => {",
      "    const text = (el.innerText || el.textContent || '').trim().toLowerCase();",
      "    return text === 'post' || text === 'publish' || text.includes('post now') || text.includes('publish now');",
      "  });",
      "  if (!target) return false;",
      "  target.click();",
      "  return true;",
      "})()",
      "\"\"\")",
      "    if clicked:",
      "        return",
      "",
      "    page.screenshot(path='/tmp/tiktok-post-button-error.png', full_page=True)",
      "    raise RuntimeError('Nao foi possivel localizar o botao final de publicacao do TikTok.')",
      "",
      "def _wait_for_publish_confirmation(page):",
      "    success_snippets = [",
      "        'successfully posted',",
      "        'successfully uploaded',",
      "        'video scheduled',",
      "        'posted successfully',",
      "        'upload complete',",
      "        'published successfully',",
      "    ]",
      "    weak_snippets = [",
      "        'uploading',",
      "        'processing',",
      "        'your video is being uploaded',",
      "        'copyright check',",
      "        'checking',",
      "    ]",
      "    post_button_selectors = [",
      "        'button[data-e2e=\"post_video_button\"]',",
      "        'button[data-e2e=\"publish-button\"]',",
      "        'button:has-text(\"Post\")',",
      "        'button:has-text(\"Publish\")',",
      "        '.TUXButton--primary',",
      "    ]",
      "",
      "    deadline = time.time() + 45",
      "    while time.time() < deadline:",
      "        page.wait_for_timeout(2000)",
      "        current_url = page.url.lower()",
      "        page_text = (page.locator('body').inner_text(timeout=5000) or '').lower()",
      "",
      "        if any(snippet in page_text for snippet in success_snippets):",
      "            return",
      "",
      "        if '/creator-center/upload' not in current_url and '/tiktokstudio/upload' not in current_url:",
      "            return",
      "",
      "        button_still_visible = False",
      "        for selector in post_button_selectors:",
      "            try:",
      "                locator = page.locator(selector).first",
      "                if locator.count() > 0 and locator.is_visible():",
      "                    button_still_visible = True",
      "                    break",
      "            except Exception:",
      "                pass",
      "",
      "        if not button_still_visible and '/manage' in current_url:",
      "            return",
      "",
      "        if not button_still_visible and any(snippet in page_text for snippet in weak_snippets):",
      "            continue",
      "",
      "    page.screenshot(path='/tmp/tiktok-publish-confirmation-error.png', full_page=True)",
      "    raise RuntimeError('O TikTok nao confirmou a publicacao. O botao de publicar pode nao ter sido concluido ou a tela pode ter exibido algum bloqueio.')",
      "",
      "upload_module._post_video = _robust_post_video",
      "",
      "auth = AuthBackend(cookies=cookies_path)",
      "playwright = sync_playwright().start()",
      "browser_type = playwright.chromium",
      "launch_args = {",
      "    'headless': headless,",
      "    'executable_path': executable_path,",
      "    'args': [",
      "        '--disable-blink-features=AutomationControlled',",
      "        '--disable-crash-reporter',",
      "        '--disable-crashpad',",
      "        '--no-sandbox',",
      "    ],",
      "}",
      "browser_instance = browser_type.launch(**launch_args)",
      "context = browser_instance.new_context(",
      "    viewport={'width': 1280, 'height': 720},",
      "    user_agent=config.disguising.user_agent,",
      "    locale='en-US',",
      ")",
      "context.add_init_script(\"\"\"",
      "Object.defineProperty(navigator, 'webdriver', { get: () => undefined });",
      "\"\"\")",
      "page = context.new_page()",
      "page.set_default_timeout(config.implicit_wait * 1000)",
      "page = auth.authenticate_agent(page)",
      "try:",
      "    complete_upload_form(page, video_path, description, None, False, None, None, 'everyone', 1, headless)",
      "    _wait_for_publish_confirmation(page)",
      "    print('TIKTOK_UPLOAD_CONFIRMED')",
      "finally:",
      "    browser_instance.close()",
      "    playwright.stop()",
    ].join("\n");
    await fs.writeFile(path.join(tempDir, "tiktok-upload-runner.py"), runnerScript, "utf8");
  }

  const shouldUseXvfb = !headless && !process.env.DISPLAY && Boolean(resolveOptionalCommand("xvfb-run"));
  const command = shouldUseXvfb ? "xvfb-run" : baseCommand;
  const args = shouldUseXvfb ? ["-a", baseCommand, ...baseArgs] : baseArgs;

  return await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: {
        ...process.env,
        TIKTOK_UPLOADER_BROWSER: browser,
      },
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    let stdoutBuffer = "";
    let stderrBuffer = "";

    const emitLines = (source: "stdout" | "stderr", chunkText: string) => {
      const nextBuffer = source === "stdout" ? stdoutBuffer + chunkText : stderrBuffer + chunkText;
      const parts = nextBuffer.split(/\r?\n/);
      const remainder = parts.pop() || "";

      for (const rawLine of parts) {
        const line = rawLine.replace(/\x1b\[[0-9;]*m/g, "").trim();
        if (!line) continue;
        void options?.onProgress?.({
          level:
            source === "stderr" || /failed|error|traceback/i.test(line)
              ? "error"
              : /confirmed|success|posted|uploaded via|uploaded$/i.test(line)
                ? "success"
                : "info",
          message: line,
        });
      }

      if (source === "stdout") stdoutBuffer = remainder;
      else stderrBuffer = remainder;
    };

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      emitLines("stdout", text);
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      emitLines("stderr", text);
    });
    child.on("error", (error) => {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        reject(
          new Error(
            `Nao foi possivel encontrar o uploader do TikTok (${command}). Verifique se a imagem do app foi rebuildada com python3, tiktok-uploader, Playwright e xvfb.`
          )
        );
        return;
      }

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
  authValue: string,
  options?: TikTokPublishOptions
): Promise<TikTokPublishResult> {
  const { tempDir, videoPath } = await downloadVideoToTemp(videoUrl, title);

  try {
    const { stdout } = await runUploaderCli(tempDir, videoPath, title, authValue, options);

    if (!stdout.includes("TIKTOK_UPLOAD_CONFIRMED")) {
      throw new Error(
        "O uploader do TikTok terminou sem confirmar a publicacao na tela. O post pode nao ter sido enviado."
      );
    }

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
  settings: TikTokPublishSettings,
  options?: TikTokPublishOptions
): Promise<TikTokPublishResult> {
  const method = getTikTokUploadMethod();
  const accessToken = settings.accessToken?.trim();
  const sessionId = settings.sessionId?.trim();
  const officialErrorMessages: string[] = [];

  if ((method === "browser" || method === "auto") && sessionId) {
    try {
      return await publishViaBrowserUploader(videoUrl, title, sessionId, options);
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

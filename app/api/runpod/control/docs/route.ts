import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrCronSecret } from "@/lib/shopee-pipeline/apiAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function GET(req: NextRequest) {
  try {
    await requireAdminOrCronSecret(req);

    const secret = req.nextUrl.searchParams.get("secret");
    const secretSuffix = secret ? `?secret=${encodeURIComponent(secret)}` : "";
    const origin = req.nextUrl.origin;
    const openApiUrl = `${origin}/api/runpod/control/openapi${secretSuffix}`;
    const controlUrl = `${origin}/api/runpod/control${secretSuffix}`;

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Runpod Control Docs</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #081018;
        --panel: #0f1c29;
        --soft: #182839;
        --line: rgba(255,255,255,0.12);
        --text: #e8f1f8;
        --muted: #a8bdcf;
        --green: #2fd67b;
        --yellow: #f7c548;
        --red: #ff7272;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, rgba(47,214,123,0.18), transparent 28%),
          radial-gradient(circle at top right, rgba(82,163,255,0.14), transparent 24%),
          var(--bg);
        color: var(--text);
      }
      .wrap { max-width: 1120px; margin: 0 auto; padding: 32px 20px 64px; }
      .hero {
        background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
        border: 1px solid var(--line);
        border-radius: 24px;
        padding: 28px;
        margin-bottom: 24px;
        box-shadow: 0 24px 80px rgba(0,0,0,0.28);
      }
      h1 { margin: 0 0 10px; font-size: 34px; }
      p { color: var(--muted); line-height: 1.55; }
      .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-top: 22px; }
      .card {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 20px;
        padding: 18px;
      }
      .method {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: .04em;
        text-transform: uppercase;
      }
      .post { background: rgba(47,214,123,0.14); color: var(--green); }
      .get { background: rgba(82,163,255,0.14); color: #8dc3ff; }
      .danger { background: rgba(255,114,114,0.14); color: var(--red); }
      .action {
        width: 100%;
        border: 0;
        border-radius: 14px;
        padding: 12px 14px;
        font-weight: 700;
        color: #06110a;
        background: linear-gradient(135deg, #9ef5bf, #2fd67b);
        cursor: pointer;
      }
      .action.secondary { background: linear-gradient(135deg, #ffe18d, #f7c548); color: #241800; }
      .action.stop { background: linear-gradient(135deg, #ffb0b0, #ff7272); color: #2c0909; }
      .small { font-size: 13px; color: var(--muted); }
      code, pre {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        background: var(--soft);
      }
      code { padding: 2px 6px; border-radius: 8px; }
      pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        border-radius: 18px;
        padding: 16px;
        border: 1px solid var(--line);
        min-height: 200px;
      }
      .row { display: grid; grid-template-columns: 1.3fr .7fr; gap: 18px; margin-top: 20px; }
      .toolbar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin: 14px 0 18px; }
      input[type="number"] {
        width: 160px;
        border: 1px solid var(--line);
        background: var(--soft);
        color: var(--text);
        border-radius: 12px;
        padding: 12px;
      }
      a { color: #8dc3ff; }
      @media (max-width: 900px) {
        .grid, .row { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <section class="hero">
        <div class="method get">Swagger-like Docs</div>
        <h1>Runpod Pod Control</h1>
        <p>Controle interno da aplicacao para o pod atual do ComfyUI. O fluxo <code>ligar</code> tenta subir o pod salvo e, se falhar no timeout, cria um novo. O fluxo <code>ligarnovo</code> sempre cria um pod novo e passa a salvar esse <code>currentPodId</code>.</p>
        <div class="small">OpenAPI JSON: <a href="${escapeHtml(openApiUrl)}" target="_blank" rel="noreferrer">${escapeHtml(openApiUrl)}</a></div>
      </section>

      <section class="grid">
        <div class="card">
          <div class="method post">POST /api/runpod/control</div>
          <h3>ligar</h3>
          <p>Tenta iniciar o pod salvo. Se falhar ou nao ficar pronto dentro do timeout, cria um novo pod com a mesma imagem e o mesmo network volume.</p>
          <button class="action" data-action="ligar">Testar ligar</button>
        </div>
        <div class="card">
          <div class="method post">POST /api/runpod/control</div>
          <h3>ligarnovo</h3>
          <p>Ignora o pod salvo e cria um novo pod imediatamente, salvando o novo <code>currentPodId</code>.</p>
          <button class="action secondary" data-action="ligarnovo">Testar ligarnovo</button>
        </div>
        <div class="card">
          <div class="method danger">POST /api/runpod/control</div>
          <h3>desligar</h3>
          <p>Envia stop para o pod atual salvo. Nao apaga o <code>currentPodId</code>, apenas interrompe o custo.</p>
          <button class="action stop" data-action="desligar">Testar desligar</button>
        </div>
      </section>

      <section class="row">
        <div class="card">
          <div class="method get">GET /api/runpod/control</div>
          <h3>Status e resposta</h3>
          <div class="toolbar">
            <label class="small" for="timeoutMs">timeoutMs</label>
            <input id="timeoutMs" type="number" min="30000" step="1000" value="180000" />
            <button class="action" id="refreshStatus">Atualizar status</button>
          </div>
          <pre id="output">Carregando status...</pre>
        </div>
        <div class="card">
          <h3>Exemplo curl</h3>
          <pre id="curlExample">curl -X POST ${escapeHtml(controlUrl)} \\
  -H "Content-Type: application/json" \\
  -d '{"action":"ligar","timeoutMs":180000}'</pre>
        </div>
      </section>
    </div>

    <script>
      const controlUrl = ${JSON.stringify(controlUrl)};

      async function loadStatus() {
        const res = await fetch(controlUrl, { cache: "no-store" });
        const data = await res.json().catch(() => ({ error: "invalid json" }));
        document.getElementById("output").textContent = JSON.stringify({ status: res.status, data }, null, 2);
      }

      async function runAction(action) {
        const timeoutMs = Number(document.getElementById("timeoutMs").value || 180000);
        document.getElementById("curlExample").textContent =
          'curl -X POST ' + controlUrl + ' \\\\\\n' +
          '  -H "Content-Type: application/json" \\\\\\n' +
          "  -d '" + JSON.stringify(action === "desligar" ? { action } : { action, timeoutMs }) + "'";

        document.getElementById("output").textContent = "Executando " + action + "...";
        const res = await fetch(controlUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action === "desligar" ? { action } : { action, timeoutMs }),
        });
        const data = await res.json().catch(() => ({ error: "invalid json" }));
        document.getElementById("output").textContent = JSON.stringify({ status: res.status, data }, null, 2);
      }

      document.querySelectorAll("[data-action]").forEach((button) => {
        button.addEventListener("click", () => runAction(button.getAttribute("data-action")));
      });
      document.getElementById("refreshStatus").addEventListener("click", loadStatus);
      loadStatus();
    </script>
  </body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error: any) {
    const status = error?.message === "Unauthorized" ? 401 : 500;
    return new NextResponse(error?.message || "Failed to render docs", { status });
  }
}

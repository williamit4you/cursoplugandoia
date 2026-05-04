"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

type Config = {
  id: string;
  isEnabled: boolean;
  siteId: string;
  searchTerms: string;
  categoryIds: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  sort: string;
  maxProductsPerRun: number;
  postIntervalHours: number;
  preferredPlatforms: string;
  autoGenerateScript: boolean;
  autoRenderVideo: boolean;
  autoEnqueueSocial: boolean;
  affiliateLinkMode: string;
  affiliateTag?: string | null;
  affiliateUrlTemplate?: string | null;
  linkBuilderCookie?: string | null;
  appId?: string | null;
  clientSecret?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenExpiresAt?: string | null;
  lastRunAt?: string | null;
};

const PLATFORM_OPTIONS = [
  { id: "YOUTUBE", label: "YouTube Shorts" },
  { id: "INSTAGRAM", label: "Instagram Reels" },
  { id: "TIKTOK", label: "TikTok" },
];

function Grid({
  container,
  xs,
  sm,
  md,
  spacing = 0,
  children,
}: {
  container?: boolean;
  item?: boolean;
  xs?: number;
  sm?: number;
  md?: number;
  spacing?: number;
  children: any;
}) {
  if (container) {
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
          gap: spacing,
        }}
      >
        {children}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        gridColumn: {
          xs: `span ${xs || 12}`,
          sm: `span ${sm || xs || 12}`,
          md: `span ${md || sm || xs || 12}`,
        },
      }}
    >
      {children}
    </Box>
  );
}

function parseArrayText(value: string, fallback: string[] = []) {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.join("\n");
  } catch {}
  return value || fallback.join("\n");
}

function parsePlatforms(value: string) {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map((item) => String(item));
  } catch {}
  return ["YOUTUBE", "INSTAGRAM", "TIKTOK"];
}

export default function MercadoLivrePage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [searchTermsText, setSearchTermsText] = useState("");
  const [categoryIdsText, setCategoryIdsText] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["YOUTUBE", "INSTAGRAM", "TIKTOK"]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [runResult, setRunResult] = useState<any | null>(null);
  const [redirectUri, setRedirectUri] = useState("");

  const affiliateReady = useMemo(() => {
    if (!config) return false;
    return Boolean(config.affiliateUrlTemplate?.trim() || config.affiliateLinkMode === "AFF_ID_PARAM");
  }, [config]);

  const templateHasDynamicToken = useMemo(() => {
    if (!config?.affiliateUrlTemplate?.trim()) return true;
    return ["{{url}}", "{{permalink}}", "{{encodedUrl}}", "{{itemId}}", "{{tag}}"].some((token) =>
      config.affiliateUrlTemplate?.includes(token)
    );
  }, [config?.affiliateUrlTemplate]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mercado-livre/config", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao carregar configuracao");
      setConfig(data);
      setSearchTermsText(parseArrayText(data.searchTerms, ["ofertas"]));
      setCategoryIdsText(parseArrayText(data.categoryIds, []));
      setPlatforms(parsePlatforms(data.preferredPlatforms));
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message || "Falha ao carregar Mercado Livre" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRedirectUri(`${window.location.origin}/api/mercado-livre/callback`);
    }
    const params = new URLSearchParams(window.location.search);
    const status = params.get("mlAuth");
    const oauthMessage = params.get("message");
    if (status === "success") {
      setMessage({ type: "success", text: "Mercado Livre autenticado. Tokens salvos com sucesso." });
    }
    if (status === "error") {
      setMessage({
        type: "error",
        text: oauthMessage || "Falha na autenticacao Mercado Livre. Confira a redirect URI e tente novamente.",
      });
    }
  }, []);

  const patchConfig = (patch: Partial<Config>) => {
    setConfig((current) => (current ? { ...current, ...patch } : current));
  };

  const togglePlatform = (platform: string) => {
    setPlatforms((current) =>
      current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform]
    );
  };

  const save = async (refreshNow = false) => {
    if (!config) return false;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/mercado-livre/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...config,
          searchTerms: searchTermsText,
          categoryIds: categoryIdsText,
          preferredPlatforms: platforms,
          refreshNow,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao salvar");
      setConfig(data);
      setMessage({ type: "success", text: "Configuracao Mercado Livre salva." });
      return true;
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message || "Falha ao salvar" });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const previewProducts = async () => {
    await save(false);
    setPreviewing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/mercado-livre/products", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao consultar produtos");
      setProducts(data.items || []);
      setMessage({ type: "info", text: `${data.items?.length || 0} produto(s) encontrados.` });
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message || "Falha ao consultar produtos" });
    } finally {
      setPreviewing(false);
    }
  };

  const runRoutine = async () => {
    await save(false);
    setRunning(true);
    setRunResult(null);
    setMessage({
      type: "info",
      text: "Rotina iniciada. Se gerar roteiro ou render, pode demorar alguns minutos.",
    });
    try {
      const res = await fetch("/api/mercado-livre/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao rodar rotina");
      setRunResult(data);
      setMessage({
        type: "success",
        text: `Rotina finalizada: ${data.created || 0} propaganda(s) criada(s).`,
      });
      await loadConfig();
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message || "Falha ao rodar rotina" });
    } finally {
      setRunning(false);
    }
  };

  const authMercadoLivre = async () => {
    const saved = await save(false);
    if (!saved) return;
    window.location.href = `/api/mercado-livre/auth?origin=${encodeURIComponent(window.location.origin)}`;
  };

  if (loading || !config) {
    return <Typography>Carregando Mercado Livre...</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 1180, mx: "auto", pb: 8 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Mercado Livre Afiliados
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Consulta produtos, cria propagandas e prepara a agenda social com intervalo entre posts.
        </Typography>
      </Box>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}

      {!affiliateReady && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          O Mercado Livre documenta a geracao de links pela Central/Barra de Afiliados. Configure um
          template de link afiliado validado no seu portal antes de ativar publicacao automatica.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "center" }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  Rotina diaria
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Padrao recomendado: 8 produtos por rodada, 1 video por produto, posts a cada 2 horas.
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.isEnabled}
                    onChange={(e) => patchConfig({ isEnabled: e.target.checked })}
                  />
                }
                label={config.isEnabled ? "Ativa" : "Inativa"}
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  label="Pais/site"
                  fullWidth
                  value={config.siteId}
                  onChange={(e) => patchConfig({ siteId: e.target.value })}
                >
                  <MenuItem value="MLB">Brasil (MLB)</MenuItem>
                  <MenuItem value="MLA">Argentina (MLA)</MenuItem>
                  <MenuItem value="MLM">Mexico (MLM)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Produtos por rodada"
                  type="number"
                  fullWidth
                  value={config.maxProductsPerRun}
                  onChange={(e) => patchConfig({ maxProductsPerRun: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Intervalo entre posts (h)"
                  type="number"
                  fullWidth
                  value={config.postIntervalHours}
                  onChange={(e) => patchConfig({ postIntervalHours: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Termos de busca"
                  fullWidth
                  multiline
                  minRows={4}
                  value={searchTermsText}
                  onChange={(e) => setSearchTermsText(e.target.value)}
                  helperText="Um termo por linha. Ex.: ofertas, casa inteligente, eletronicos."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Categorias Mercado Livre (opcional)"
                  fullWidth
                  multiline
                  minRows={2}
                  value={categoryIdsText}
                  onChange={(e) => setCategoryIdsText(e.target.value)}
                  helperText="Um ID por linha. Deixe vazio para buscar em todas."
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Preco minimo"
                  type="number"
                  fullWidth
                  value={config.minPrice ?? ""}
                  onChange={(e) => patchConfig({ minPrice: e.target.value ? Number(e.target.value) : null })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Preco maximo"
                  type="number"
                  fullWidth
                  value={config.maxPrice ?? ""}
                  onChange={(e) => patchConfig({ maxPrice: e.target.value ? Number(e.target.value) : null })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  label="Ordenacao"
                  fullWidth
                  value={config.sort}
                  onChange={(e) => patchConfig({ sort: e.target.value })}
                >
                  <MenuItem value="relevance">Relevancia</MenuItem>
                  <MenuItem value="price_asc">Menor preco</MenuItem>
                  <MenuItem value="price_desc">Maior preco</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
              Produtos encontrados
            </Typography>
            {products.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Clique em consultar produtos para validar sua configuracao.
              </Typography>
            ) : (
              <Box sx={{ display: "grid", gap: 1.5 }}>
                {products.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "64px 1fr",
                      gap: 2,
                      p: 1.5,
                      border: "1px solid #e5e7eb",
                      borderRadius: 2,
                    }}
                  >
                    <Box sx={{ width: 64, height: 64, bgcolor: "#f3f4f6", borderRadius: 1, overflow: "hidden" }}>
                      {item.thumbnailUrl && (
                        <img src={item.thumbnailUrl} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 900, lineHeight: 1.2 }}>{item.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.id} | {item.currencyId || "BRL"} {item.price ?? "-"} | vendas: {item.soldQuantity ?? "-"}
                      </Typography>
                      {item.affiliateWarning && (
                        <Typography variant="caption" color="warning.main">
                          {item.affiliateWarning}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Link afiliado
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
              Use o template aprovado pelo seu Portal do Afiliado. Tokens: {"{{url}}"}, {"{{encodedUrl}}"},
              {" {{itemId}}"} e {"{{tag}}"}.
            </Typography>

            <TextField
              select
              label="Modo de link"
              fullWidth
              value={config.affiliateLinkMode}
              onChange={(e) => patchConfig({ affiliateLinkMode: e.target.value })}
              sx={{ mb: 2 }}
            >
              <MenuItem value="MANUAL_TEMPLATE">Template validado</MenuItem>
              <MenuItem value="AFF_ID_PARAM">Parametro aff_id (validar no ML)</MenuItem>
              <MenuItem value="RAW_PERMALINK">Sem afiliado por enquanto</MenuItem>
            </TextField>
            <TextField
              label="Etiqueta / tag afiliado"
              fullWidth
              value={config.affiliateTag || ""}
              onChange={(e) => patchConfig({ affiliateTag: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Template de URL afiliada"
              fullWidth
              multiline
              minRows={3}
              value={config.affiliateUrlTemplate || ""}
              onChange={(e) => patchConfig({ affiliateUrlTemplate: e.target.value })}
              placeholder="Ex.: https://...{{encodedUrl}}..."
              sx={{ mb: 2 }}
            />
            {!templateHasDynamicToken && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Esse parece ser um link afiliado fixo de um unico produto. Para automatizar varios produtos,
                o template precisa ter pelo menos um token, como {"{{encodedUrl}}"} ou {"{{url}}"}.
              </Alert>
            )}
            <TextField
              label="Cookie/Token do Link Builder (guardado, nao usado no MVP)"
              fullWidth
              multiline
              minRows={3}
              type="password"
              value={config.linkBuilderCookie || ""}
              onChange={(e) => patchConfig({ linkBuilderCookie: e.target.value })}
            />
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              OAuth Mercado Livre
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
              Salve Client ID e chave secreta, cadastre a redirect URI abaixo no app Mercado Livre e autentique pelo botao.
            </Typography>
            {redirectUri && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Redirect URI exata: <strong>{redirectUri}</strong>
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="App ID / Client ID"
                  fullWidth
                  value={config.appId || ""}
                  onChange={(e) => patchConfig({ appId: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Client Secret"
                  fullWidth
                  type="password"
                  value={config.clientSecret || ""}
                  onChange={(e) => patchConfig({ clientSecret: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Access Token"
                  fullWidth
                  multiline
                  minRows={2}
                  type="password"
                  value={config.accessToken || ""}
                  onChange={(e) => patchConfig({ accessToken: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Refresh Token"
                  fullWidth
                  multiline
                  minRows={2}
                  type="password"
                  value={config.refreshToken || ""}
                  onChange={(e) => patchConfig({ refreshToken: e.target.value })}
                />
              </Grid>
            </Grid>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center", mt: 2 }}>
              <Button
                variant="contained"
                color="warning"
                onClick={authMercadoLivre}
                disabled={saving || !config.appId || !config.clientSecret}
              >
                Autenticar Mercado Livre
              </Button>
              {config.refreshToken ? (
                <Typography variant="body2" sx={{ color: "success.main", fontWeight: 900 }}>
                  Conta autenticada
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Aguardando token
                </Typography>
              )}
            </Box>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Saida social
            </Typography>
            <Box sx={{ display: "grid", gap: 1, mt: 1 }}>
              {PLATFORM_OPTIONS.map((platform) => (
                <FormControlLabel
                  key={platform.id}
                  control={
                    <Checkbox
                      checked={platforms.includes(platform.id)}
                      onChange={() => togglePlatform(platform.id)}
                    />
                  }
                  label={platform.label}
                />
              ))}
            </Box>
            <Divider sx={{ my: 2 }} />
            <FormControlLabel
              control={
                <Switch
                  checked={config.autoGenerateScript}
                  onChange={(e) => patchConfig({ autoGenerateScript: e.target.checked })}
                />
              }
              label="Gerar roteiro automaticamente"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.autoRenderVideo}
                  onChange={(e) => patchConfig({ autoRenderVideo: e.target.checked })}
                />
              }
              label="Renderizar video na rotina"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.autoEnqueueSocial}
                  onChange={(e) => patchConfig({ autoEnqueueSocial: e.target.checked })}
                />
              }
              label="Agendar posts ao finalizar render"
            />
          </Paper>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 3 }}>
            <Button variant="contained" onClick={() => save(false)} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
            <Button variant="outlined" onClick={() => save(true)} disabled={saving}>
              Salvar e renovar token
            </Button>
            <Button variant="outlined" onClick={previewProducts} disabled={previewing || saving}>
              {previewing ? "Consultando..." : "Consultar produtos"}
            </Button>
            <Button variant="contained" color="success" onClick={runRoutine} disabled={running || saving}>
              {running ? "Rodando..." : "Rodar rotina agora"}
            </Button>
          </Box>

          {runResult && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
                Ultima execucao
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Encontrados: {runResult.found} | Criados: {runResult.created} | Ignorados: {runResult.skippedExisting}
              </Typography>
              <Box sx={{ display: "grid", gap: 1 }}>
                {(runResult.results || []).map((item: any) => (
                  <Box key={item.projectId} sx={{ p: 1.5, border: "1px solid #e5e7eb", borderRadius: 2 }}>
                    <Typography sx={{ fontWeight: 900 }}>{item.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Agendado base: {new Date(item.scheduledTo).toLocaleString("pt-BR")}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Link href={`/admin/propagandas/${item.projectId}`}>Abrir propaganda</Link>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

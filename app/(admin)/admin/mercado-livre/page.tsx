"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";

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
  { id: "TIKTOK", label: "TikTok (configurar depois)" },
];

const DEFAULT_CATEGORY_LINES = [
  "MLB1648 - Informatica",
  "MLB1051 - Celulares e Telefones",
  "MLB1000 - Eletronicos, Audio e Video",
  "MLB1144 - Games",
  "MLB5726 - Eletrodomesticos",
  "MLB1574 - Casa, Moveis e Decoracao",
  "MLB1276 - Esportes e Fitness",
  "MLB1246 - Beleza e Cuidado Pessoal",
  "MLB1132 - Brinquedos e Hobbies",
  "MLB407134 - Ferramentas",
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
  return ["YOUTUBE", "INSTAGRAM"];
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
  const [importingLinks, setImportingLinks] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [runResult, setRunResult] = useState<any | null>(null);
  const [redirectUri, setRedirectUri] = useState("");
  const [manualLinksText, setManualLinksText] = useState("");

  const affiliateReady = useMemo(() => {
    if (!config) return false;
    return Boolean(
      config.linkBuilderCookie?.trim() ||
        config.affiliateUrlTemplate?.trim() ||
        (config.affiliateLinkMode === "AFF_ID_PARAM" && config.affiliateTag?.trim())
    );
  }, [config]);

  const templateHasDynamicToken = useMemo(() => {
    if (!config?.affiliateUrlTemplate?.trim()) return true;
    return ["{{url}}", "{{permalink}}", "{{encodedUrl}}", "{{itemId}}", "{{tag}}"].some((token) =>
      config.affiliateUrlTemplate?.includes(token)
    );
  }, [config?.affiliateUrlTemplate]);

  const nextRunText = useMemo(() => {
    if (!config?.lastRunAt) return "Assim que o cron chamar";
    const lastRun = new Date(config.lastRunAt).getTime();
    if (!Number.isFinite(lastRun)) return "Assim que o cron chamar";
    return new Date(lastRun + Number(config.postIntervalHours || 3) * 60 * 60 * 1000).toLocaleString("pt-BR");
  }, [config?.lastRunAt, config?.postIntervalHours]);

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

  const importManualLinks = async () => {
    const saved = await save(false);
    if (!saved) return;
    setImportingLinks(true);
    setRunResult(null);
    setMessage({ type: "info", text: "Importando links e criando propagandas..." });
    try {
      const res = await fetch("/api/mercado-livre/manual-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: manualLinksText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao importar links");
      setRunResult(data);
      setMessage({ type: "success", text: `${data.created || 0} propaganda(s) criada(s) a partir dos links.` });
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message || "Falha ao importar links" });
    } finally {
      setImportingLinks(false);
    }
  };

  if (loading || !config) {
    return <Typography>Carregando Mercado Livre...</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 1180, mx: "auto", pb: 8 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Mercado Livre Afiliados
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Rotina configurada para buscar 1 produto novo, criar propaganda e publicar com intervalo de 3 horas.
        </Typography>
      </Box>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      {!affiliateReady && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Para gerar links de venda com comissao, preencha o Cookie do Link Builder ou configure um
          template dinamico validado no Portal do Afiliado.
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
          <Chip color={config.isEnabled ? "success" : "default"} label={config.isEnabled ? "Rotina ativa" : "Rotina pausada"} />
          <Chip label={`${config.maxProductsPerRun} produto por rodada`} />
          <Chip label={`A cada ${config.postIntervalHours}h`} />
          <Chip label={`Proxima: ${nextRunText}`} />
          <Chip label={`Saida: ${platforms.join(", ") || "nenhuma"}`} />
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 2 }}>
          <Button startIcon={<SaveIcon />} variant="contained" onClick={() => save(false)} disabled={saving}>
            {saving ? "Salvando..." : "Salvar configuracao"}
          </Button>
          <Button startIcon={<SearchIcon />} variant="outlined" onClick={previewProducts} disabled={previewing || saving}>
            {previewing ? "Consultando..." : "Consultar proximo produto"}
          </Button>
          <Button startIcon={<PlayArrowIcon />} variant="contained" color="success" onClick={runRoutine} disabled={running || saving}>
            {running ? "Rodando..." : "Rodar rotina agora"}
          </Button>
        </Box>
      </Paper>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 900 }}>1. Automacao e selecao de produtos</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.isEnabled}
                      onChange={(e) => patchConfig({ isEnabled: e.target.checked })}
                    />
                  }
                  label={config.isEnabled ? "Rotina automatica ativa" : "Rotina automatica pausada"}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  O cron chama a rotina e ela roda somente quando completar o intervalo configurado.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4} md={2}>
              <TextField
                label="Produtos por rodada"
                type="number"
                fullWidth
                value={config.maxProductsPerRun}
                onChange={(e) => patchConfig({ maxProductsPerRun: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={2}>
              <TextField
                label="Intervalo (h)"
                type="number"
                fullWidth
                value={config.postIntervalHours}
                onChange={(e) => patchConfig({ postIntervalHours: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={4}>
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
            <Grid item xs={12} md={6}>
              <TextField
                label="Termos de busca"
                fullWidth
                multiline
                minRows={4}
                value={searchTermsText}
                onChange={(e) => setSearchTermsText(e.target.value)}
                helperText="Um termo por linha. Para a rotina atual, 'ofertas' funciona junto com a lista de categorias."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Categorias percorridas"
                fullWidth
                multiline
                minRows={4}
                value={categoryIdsText}
                onChange={(e) => setCategoryIdsText(e.target.value)}
                helperText="Um ID por linha. A rotina gira essa lista e pula produtos que ja viraram video."
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {DEFAULT_CATEGORY_LINES.map((item) => (
                  <Chip key={item} size="small" label={item} />
                ))}
              </Box>
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
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 900 }}>2. Publicacao social</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={5}>
              <Box sx={{ display: "grid", gap: 1 }}>
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
            </Grid>
            <Grid item xs={12} md={7}>
              <Box sx={{ display: "grid", gap: 1 }}>
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
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded={!affiliateReady}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 900 }}>3. Link afiliado</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Com Cookie do Link Builder, o sistema tenta gerar o link afiliado automaticamente. Sem cookie,
            ele usa o template dinamico abaixo.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Modo de link"
                fullWidth
                value={config.affiliateLinkMode}
                onChange={(e) => patchConfig({ affiliateLinkMode: e.target.value })}
              >
                <MenuItem value="LINK_BUILDER">Link Builder automatico</MenuItem>
                <MenuItem value="MANUAL_TEMPLATE">Template validado</MenuItem>
                <MenuItem value="AFF_ID_PARAM">Parametro aff_id (validar no ML)</MenuItem>
                <MenuItem value="RAW_PERMALINK">Sem afiliado por enquanto</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                label="Etiqueta / tag afiliado"
                fullWidth
                value={config.affiliateTag || ""}
                onChange={(e) => patchConfig({ affiliateTag: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Cookie do Link Builder"
                fullWidth
                multiline
                minRows={3}
                type="password"
                value={config.linkBuilderCookie || ""}
                onChange={(e) => patchConfig({ linkBuilderCookie: e.target.value })}
                helperText="Cole o header Cookie de uma requisicao logada do Gerador de Links do Mercado Livre."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Template de URL afiliada"
                fullWidth
                multiline
                minRows={3}
                value={config.affiliateUrlTemplate || ""}
                onChange={(e) => patchConfig({ affiliateUrlTemplate: e.target.value })}
                placeholder="Ex.: https://...{{encodedUrl}}..."
                helperText='Tokens aceitos: {{url}}, {{encodedUrl}}, {{itemId}} e {{tag}}.'
              />
            </Grid>
            {!templateHasDynamicToken && (
              <Grid item xs={12}>
                <Alert severity="warning">
                  Esse parece ser um link afiliado fixo de um unico produto. Para automatizar varios produtos,
                  o template precisa ter pelo menos um token.
                </Alert>
              </Grid>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 900 }}>4. OAuth Mercado Livre</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {redirectUri && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Redirect URI exata: <strong>{redirectUri}</strong>
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="App ID / Client ID"
                fullWidth
                value={config.appId || ""}
                onChange={(e) => patchConfig({ appId: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Client Secret"
                fullWidth
                type="password"
                value={config.clientSecret || ""}
                onChange={(e) => patchConfig({ clientSecret: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
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
            <Grid item xs={12} md={6}>
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
            <Grid item xs={12}>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
                <Button
                  variant="contained"
                  color="warning"
                  onClick={authMercadoLivre}
                  disabled={saving || !config.appId || !config.clientSecret}
                >
                  Autenticar Mercado Livre
                </Button>
                <Button variant="outlined" onClick={() => save(true)} disabled={saving}>
                  Salvar e renovar token
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
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 900 }}>5. Produto consultado e ultima execucao</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {products.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Clique em consultar proximo produto para validar a configuracao.
            </Typography>
          ) : (
            <Box sx={{ display: "grid", gap: 1.5, mb: 3 }}>
              {products.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "64px 1fr",
                    gap: 2,
                    p: 1.5,
                    border: "1px solid #e5e7eb",
                    borderRadius: 1,
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
                      {item.id} | {item.currencyId || "BRL"} {item.price ?? "-"} | categoria: {item.categoryId || "-"}
                    </Typography>
                    {item.affiliateWarning && (
                      <Typography variant="caption" color="warning.main" sx={{ display: "block" }}>
                        {item.affiliateWarning}
                      </Typography>
                    )}
                    {item.affiliateUrl && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", wordBreak: "break-all" }}>
                        Link para descricao: {item.affiliateUrl}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {runResult && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 1 }}>
                Ultima execucao
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Encontrados: {runResult.found ?? "-"} | Criados: {runResult.created ?? "-"} | Ja usados: {runResult.skippedExisting ?? "-"}
              </Typography>
              <Box sx={{ display: "grid", gap: 1 }}>
                {(runResult.results || []).map((item: any) => (
                  <Box key={item.projectId} sx={{ p: 1.5, border: "1px solid #e5e7eb", borderRadius: 1 }}>
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
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 900 }}>6. Importacao manual</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField
            label="Links de produtos Mercado Livre"
            fullWidth
            multiline
            minRows={6}
            value={manualLinksText}
            onChange={(e) => setManualLinksText(e.target.value)}
            placeholder={`https://www.mercadolivre.com.br/produto-exemplo/p/MLB...\nhttps://produto.mercadolivre.com.br/MLB-...`}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            color="success"
            disabled={importingLinks || manualLinksText.trim().length === 0}
            onClick={importManualLinks}
          >
            {importingLinks ? "Importando..." : "Criar propagandas desses links"}
          </Button>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

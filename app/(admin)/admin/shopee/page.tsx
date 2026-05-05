"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Paper,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

type Config = {
  id: string;
  isEnabled: boolean;
  site: string;
  domain: string;
  searchTerms: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  maxProductsPerRun: number;
  postIntervalHours: number;
  preferredPlatforms: string;
  autoGenerateScript: boolean;
  autoRenderVideo: boolean;
  autoEnqueueSocial: boolean;
  appId?: string | null;
  clientSecret?: string | null;
  lastRunAt?: string | null;
};

type Product = {
  id: string;
  title: string;
  price: number | null;
  currencyId: string | null;
  permalink: string;
  thumbnailUrl: string | null;
  soldQuantity: number | null;
  ratingStar: number | null;
  reviewCount: number | null;
  description: string | null;
  imageUrls: string[];
};

const PLATFORM_OPTIONS = [
  { id: "YOUTUBE", label: "YouTube Shorts" },
  { id: "INSTAGRAM", label: "Instagram Reels" },
  { id: "TIKTOK", label: "TikTok (configurar depois)" },
];

async function readJsonResponse(res: Response): Promise<{
  data: any | null;
  text: string;
  contentType: string;
}> {
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();

  if (contentType.toLowerCase().includes("application/json")) {
    try {
      return { data: JSON.parse(text || "null"), text, contentType };
    } catch {
      return { data: null, text, contentType };
    }
  }

  try {
    return { data: JSON.parse(text || "null"), text, contentType };
  } catch {
    return { data: null, text, contentType };
  }
}

function buildNonJsonApiError(res: Response, contentType: string, text: string) {
  const snippet = String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
  const ct = contentType ? `content-type: ${contentType}` : "content-type desconhecido";
  const extra =
    snippet && snippet.includes("<!DOCTYPE html")
      ? " (parece uma pagina HTML do proxy/servidor, nao JSON)"
      : snippet
        ? ` (resposta: ${snippet})`
        : "";
  return new Error(`API retornou ${res.status} ${res.statusText} (${ct})${extra}.`);
}

function parseArrayText(value: string, fallback: string[] = []) {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map((item) => String(item));
  } catch {
    // ignore
  }
  return fallback;
}

function formatPriceBRL(price: number | null | undefined) {
  if (price == null) return "Preço n/d";
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);
  } catch {
    return `R$ ${price}`;
  }
}

export default function ShopeeAdminPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [searchTermsText, setSearchTermsText] = useState("[\"ofertas\"]");
  const [platforms, setPlatforms] = useState<string[]>(["YOUTUBE", "INSTAGRAM"]);
  const [products, setProducts] = useState<Product[]>([]);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<any | null>(null);

  const platformsText = useMemo(() => JSON.stringify(platforms), [platforms]);

  const loadConfig = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/shopee/config", { cache: "no-store" });
      const { data, text, contentType } = await readJsonResponse(res);
      if (!data && contentType && !contentType.toLowerCase().includes("application/json")) {
        throw buildNonJsonApiError(res, contentType, text);
      }
      if (!res.ok) throw new Error(data?.error || "Falha ao carregar Shopee");
      setConfig(data);
      setSearchTermsText(data.searchTerms || "[\"ofertas\"]");
      setPlatforms(parseArrayText(data.preferredPlatforms, ["YOUTUBE", "INSTAGRAM"]));
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message || "Falha ao carregar Shopee" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
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

  const save = async () => {
    if (!config) return false;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/shopee/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...config,
          searchTerms: searchTermsText,
          preferredPlatforms: platforms,
        }),
      });
      const { data, text, contentType } = await readJsonResponse(res);
      if (!data && contentType && !contentType.toLowerCase().includes("application/json")) {
        throw buildNonJsonApiError(res, contentType, text);
      }
      if (!res.ok) throw new Error(data?.error || `Falha ao salvar (HTTP ${res.status})`);
      setConfig(data);
      setMessage({ type: "success", text: "Configuração Shopee salva." });
      return true;
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message || "Falha ao salvar" });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const previewProducts = async () => {
    const ok = await save();
    if (!ok) return;
    setPreviewing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/shopee/products", { cache: "no-store" });
      const { data, text, contentType } = await readJsonResponse(res);
      if (!data && contentType && !contentType.toLowerCase().includes("application/json")) {
        throw buildNonJsonApiError(res, contentType, text);
      }
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
    const ok = await save();
    if (!ok) return;
    setRunning(true);
    setRunResult(null);
    setMessage({
      type: "info",
      text: "Rotina Shopee iniciada. Se gerar roteiro ou render, pode demorar alguns minutos.",
    });
    try {
      const res = await fetch("/api/shopee/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const { data, text, contentType } = await readJsonResponse(res);
      if (!data && contentType && !contentType.toLowerCase().includes("application/json")) {
        throw buildNonJsonApiError(res, contentType, text);
      }
      if (!res.ok) throw new Error(data?.error || "Falha ao rodar rotina");
      setRunResult(data);
      setMessage({ type: "success", text: `Rotina finalizada: ${data.created || 0} item(ns) criado(s).` });
      await loadConfig();
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message || "Falha ao rodar rotina" });
    } finally {
      setRunning(false);
    }
  };

  if (loading || !config) {
    return <Typography>Carregando Shopee...</Typography>;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box>
        <Typography variant="h3" sx={{ fontWeight: 900 }}>
          Shopee Afiliados
        </Typography>
        <Typography sx={{ opacity: 0.85, mt: 1 }}>
          Configuração para buscar promoções/produtos na Shopee e preparar conteúdo para vídeo.
        </Typography>
      </Box>

      {message ? <Alert severity={message.type}>{message.text}</Alert> : null}

      <Paper sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 900, mb: 1 }}>1. Rotina</Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
          <Chip
            color={config.isEnabled ? "success" : "default"}
            label={config.isEnabled ? "Rotina ativa" : "Rotina desativada"}
          />
          <Chip label={`${config.maxProductsPerRun || 1} produto por rodada`} />
          <Chip label={`A cada ${config.postIntervalHours || 3}h`} />
          <Chip label={`Plataformas: ${platformsText}`} />
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 900, mb: 1 }}>2. Configuração</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(config.isEnabled)}
                  onChange={(e) => patchConfig({ isEnabled: e.target.checked })}
                />
              }
              label="Ativar rotina"
            />
          </Box>

          <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
            <TextField
              fullWidth
              label="Domínio Shopee"
              value={config.domain || "shopee.com.br"}
              onChange={(e) => patchConfig({ domain: e.target.value })}
              helperText="Ex.: shopee.com.br (sem https://)"
            />
          </Box>

          <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
            <TextField
              fullWidth
              label="Site"
              value={config.site || "br"}
              onChange={(e) => patchConfig({ site: e.target.value })}
              helperText="Região (br, mx, co, cl...)"
            />
          </Box>

          <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
            <TextField
              fullWidth
              label="Produtos por rodada"
              type="number"
              value={config.maxProductsPerRun || 1}
              onChange={(e) => patchConfig({ maxProductsPerRun: Number(e.target.value) })}
              slotProps={{ htmlInput: { min: 1, max: 24 } }}
            />
          </Box>

          <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
            <TextField
              fullWidth
              label="Intervalo (horas)"
              type="number"
              value={config.postIntervalHours || 3}
              onChange={(e) => patchConfig({ postIntervalHours: Number(e.target.value) })}
              slotProps={{ htmlInput: { min: 1, max: 24 } }}
            />
          </Box>

          <Box sx={{ gridColumn: "span 12" }}>
            <TextField
              fullWidth
              label="Termos de busca (JSON array)"
              value={searchTermsText}
              onChange={(e) => setSearchTermsText(e.target.value)}
              multiline
              minRows={2}
              helperText='Ex.: ["ofertas","eletronicos","casa"]'
            />
          </Box>

          <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
            <TextField
              fullWidth
              label="Preço mínimo (R$)"
              type="number"
              value={config.minPrice ?? ""}
              onChange={(e) => patchConfig({ minPrice: e.target.value === "" ? null : Number(e.target.value) })}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
            <TextField
              fullWidth
              label="Preço máximo (R$)"
              type="number"
              value={config.maxPrice ?? ""}
              onChange={(e) => patchConfig({ maxPrice: e.target.value === "" ? null : Number(e.target.value) })}
            />
          </Box>

          <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
            <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Plataformas</Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {PLATFORM_OPTIONS.map((opt) => (
                <FormControlLabel
                  key={opt.id}
                  control={
                    <Checkbox checked={platforms.includes(opt.id)} onChange={() => togglePlatform(opt.id)} />
                  }
                  label={opt.label}
                />
              ))}
            </Box>
          </Box>

          <Box sx={{ gridColumn: "span 12" }}>
            <Divider sx={{ my: 1 }} />
            <Typography sx={{ fontWeight: 900, mb: 1 }}>3. Credenciais Shopee (Open Platform)</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Estas credenciais (Partner ID/Key) são salvas no banco para uso futuro. Para segurança, também pode
              configurar via env no servidor: <code>SHOPEE_APP_ID</code> e <code>SHOPEE_SECRET_KEY</code>.
            </Alert>
          </Box>

          <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
            <TextField
              fullWidth
              label="AppID / Partner ID"
              value={config.appId || ""}
              onChange={(e) => patchConfig({ appId: e.target.value })}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
            <TextField
              fullWidth
              label="Senha / Secret Key (Partner Key)"
              type="password"
              value={config.clientSecret || ""}
              onChange={(e) => patchConfig({ clientSecret: e.target.value })}
            />
          </Box>

          <Box sx={{ gridColumn: "span 12" }}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button variant="contained" startIcon={<SaveIcon />} disabled={saving} onClick={save}>
                Salvar configuração
              </Button>
              <Button
                variant="outlined"
                startIcon={<SearchIcon />}
                disabled={previewing || saving}
                onClick={previewProducts}
              >
                Consultar próximo produto
              </Button>
              <Button
                variant="outlined"
                startIcon={<PlayArrowIcon />}
                disabled={running || saving}
                onClick={runRoutine}
              >
                Rodar rotina agora
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      {runResult ? (
        <Paper sx={{ p: 2 }}>
          <Typography sx={{ fontWeight: 900, mb: 1 }}>5. Resultado da rotina</Typography>
          <Typography sx={{ opacity: 0.75, fontSize: 13, whiteSpace: "pre-wrap" }}>
            {JSON.stringify(runResult, null, 2)}
          </Typography>
        </Paper>
      ) : null}

      <Paper sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 900, mb: 1 }}>6. Preview produtos</Typography>
        {products.length === 0 ? (
          <Typography sx={{ opacity: 0.75 }}>Nenhum produto carregado ainda.</Typography>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
            {products.map((product) => (
              <Box
                key={product.id}
                sx={{
                  gridColumn: { xs: "span 12", md: "span 6", lg: "span 4" },
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <Box sx={{ display: "flex", gap: 2, p: 2 }}>
                  {product.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.thumbnailUrl}
                      alt={product.title}
                      style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8 }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 96,
                        height: 96,
                        borderRadius: 2,
                        bgcolor: "rgba(255,255,255,0.06)",
                      }}
                    />
                  )}
                  <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
                    <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }} title={product.title}>
                      {product.title}
                    </Typography>
                    <Typography sx={{ opacity: 0.9 }}>{formatPriceBRL(product.price)}</Typography>
                    <Typography sx={{ opacity: 0.7, fontSize: 13 }}>
                      {product.ratingStar != null ? `⭐ ${product.ratingStar.toFixed(1)}` : "⭐ n/d"}{" "}
                      {product.reviewCount != null ? `(${product.reviewCount})` : ""}
                      {product.soldQuantity != null ? ` • vendidos: ${product.soldQuantity}` : ""}
                    </Typography>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => window.open(product.permalink, "_blank")}
                      sx={{ justifyContent: "flex-start", px: 0 }}
                    >
                      Abrir na Shopee
                    </Button>
                  </Box>
                </Box>
                {product.description ? (
                  <Box sx={{ px: 2, pb: 2 }}>
                    <Typography sx={{ opacity: 0.75, fontSize: 13 }}>
                      {product.description.slice(0, 240)}
                      {product.description.length > 240 ? "..." : ""}
                    </Typography>
                  </Box>
                ) : null}
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
}

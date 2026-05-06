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
  MenuItem,
  Paper,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import {
  AUTOMATION_TASK_STATUSES,
  AUTOMATION_TASK_TYPES,
  DEFAULT_TASK_CONFIGS,
  normalizeTaskType,
  safeJsonStringify,
  slugifyTaskName,
  type AutomationTaskStatusValue,
  type AutomationTaskTypeValue,
} from "@/lib/tasks/catalog";

type PublishPlatform = "YOUTUBE" | "TIKTOK" | "INSTAGRAM_REELS" | "INSTAGRAM_STORIES";

type TaskRecord = {
  id?: string;
  name: string;
  slug: string;
  type: AutomationTaskTypeValue;
  status: AutomationTaskStatusValue;
  isEnabled: boolean;
  timezone: string;
  cronExpression: string;
  runIntervalMinutes: string;
  maxRunsPerDay: string;
  priority: string;
  creativeTemplateId: string;
  sourceConfigJson: string;
  creativeConfigJson: string;
  publishConfigJson: string;
  executionConfigJson: string;
};

type GuidedSourceConfig = {
  searchTerms: string[];
  limit: number;
  minPrice: number;
  maxPrice: number | null;
  minCommissionRate: number;
  minSales: number;
};

type GuidedPublishConfig = {
  platforms: PublishPlatform[];
  timeSlots: string[];
  autoPost: boolean;
};

const SEARCH_TERM_PRESETS: Record<string, string[]> = {
  SHOPEE_VIDEO: ["fone bluetooth", "air fryer", "cadeira gamer", "smartwatch", "kit ferramentas"],
  MERCADO_LIVRE_VIDEO: ["notebook", "celular", "monitor", "ofertas"],
};

function buildTaskDraft(type: AutomationTaskTypeValue): TaskRecord {
  const defaults = DEFAULT_TASK_CONFIGS[type];
  return {
    name: "",
    slug: "",
    type,
    status: "DRAFT",
    isEnabled: true,
    timezone: "America/Sao_Paulo",
    cronExpression: "",
    runIntervalMinutes: "",
    maxRunsPerDay: "",
    priority: "100",
    creativeTemplateId: "",
    sourceConfigJson: safeJsonStringify(defaults.sourceConfig),
    creativeConfigJson: safeJsonStringify(defaults.creativeConfig),
    publishConfigJson: safeJsonStringify(defaults.publishConfig),
    executionConfigJson: safeJsonStringify(defaults.executionConfig),
  };
}

function defaultGuidedSource(type: AutomationTaskTypeValue): GuidedSourceConfig {
  if (type === "SHOPEE_VIDEO") {
    return { searchTerms: ["ofertas"], limit: 20, minPrice: 10, maxPrice: null, minCommissionRate: 5, minSales: 100 };
  }
  if (type === "MERCADO_LIVRE_VIDEO") {
    return { searchTerms: ["ofertas"], limit: 20, minPrice: 10, maxPrice: null, minCommissionRate: 0, minSales: 0 };
  }
  return { searchTerms: ["ofertas"], limit: 20, minPrice: 0, maxPrice: null, minCommissionRate: 0, minSales: 0 };
}

function defaultGuidedPublish(): GuidedPublishConfig {
  return {
    platforms: ["YOUTUBE", "INSTAGRAM_REELS", "TIKTOK"],
    timeSlots: ["08:00", "14:00", "20:00"],
    autoPost: false,
  };
}

function safeParseJson(value: string) {
  try {
    return JSON.parse(value || "{}");
  } catch {
    return null;
  }
}

function normalizeTimeSlots(values: string[]) {
  const cleaned = values
    .map((v) => String(v || "").trim())
    .filter(Boolean)
    .map((v) => {
      const match = v.match(/^(\d{1,2}):(\d{2})$/);
      if (!match) return "";
      const hh = String(Math.min(23, Math.max(0, Number(match[1])))).padStart(2, "0");
      const mm = String(Math.min(59, Math.max(0, Number(match[2])))).padStart(2, "0");
      return `${hh}:${mm}`;
    })
    .filter(Boolean);
  return Array.from(new Set(cleaned)).sort();
}

function normalizePlatforms(values: unknown): PublishPlatform[] {
  const allowed: PublishPlatform[] = ["YOUTUBE", "TIKTOK", "INSTAGRAM_REELS", "INSTAGRAM_STORIES"];
  const list = Array.isArray(values) ? values : [];
  const normalized = list.map((v) => String(v || "").trim().toUpperCase());
  const picked = normalized.filter((v) => allowed.includes(v as PublishPlatform)) as PublishPlatform[];
  return picked.length > 0 ? Array.from(new Set(picked)) : ["YOUTUBE", "INSTAGRAM_REELS"];
}

function buildSourceConfigJson(type: AutomationTaskTypeValue, guided: GuidedSourceConfig) {
  const searchTerms = Array.from(new Set((guided.searchTerms || []).map((v) => String(v || "").trim()).filter(Boolean))).slice(0, 20);
  if (type === "SHOPEE_VIDEO") {
    return safeJsonStringify({
      searchTerms,
      limit: guided.limit,
      minPrice: guided.minPrice,
      minCommissionRate: guided.minCommissionRate,
      minSales: guided.minSales,
    });
  }
  if (type === "MERCADO_LIVRE_VIDEO") {
    return safeJsonStringify({
      searchTerms,
      limit: guided.limit,
      minPrice: guided.minPrice,
      maxPrice: guided.maxPrice,
    });
  }
  return safeJsonStringify({ searchTerms });
}

function buildPublishConfigJson(guided: GuidedPublishConfig) {
  return safeJsonStringify({
    platforms: guided.platforms,
    autoPost: guided.autoPost,
    timeSlots: normalizeTimeSlots(guided.timeSlots),
  });
}

function parseServerTask(data: any): TaskRecord {
  return {
    id: data.id,
    name: data.name || "",
    slug: data.slug || "",
    type: normalizeTaskType(data.type),
    status: (data.status || "DRAFT") as AutomationTaskStatusValue,
    isEnabled: Boolean(data.isEnabled),
    timezone: data.timezone || "America/Sao_Paulo",
    cronExpression: data.cronExpression || "",
    runIntervalMinutes: data.runIntervalMinutes == null ? "" : String(data.runIntervalMinutes),
    maxRunsPerDay: data.maxRunsPerDay == null ? "" : String(data.maxRunsPerDay),
    priority: data.priority == null ? "100" : String(data.priority),
    creativeTemplateId: data.creativeTemplateId || "",
    sourceConfigJson: data.sourceConfigJson || "{}",
    creativeConfigJson: data.creativeConfigJson || "{}",
    publishConfigJson: data.publishConfigJson || "{}",
    executionConfigJson: data.executionConfigJson || "{}",
  };
}

export default function TaskForm({ taskId }: { taskId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<TaskRecord>(buildTaskDraft("SHOPEE_VIDEO"));
  const [advanced, setAdvanced] = useState(false);
  const [guidedSource, setGuidedSource] = useState<GuidedSourceConfig>(defaultGuidedSource("SHOPEE_VIDEO"));
  const [guidedPublish, setGuidedPublish] = useState<GuidedPublishConfig>(defaultGuidedPublish());
  const [searchTermInput, setSearchTermInput] = useState("");
  const [timeSlotInput, setTimeSlotInput] = useState("");
  const [loading, setLoading] = useState(Boolean(taskId));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const syncGuidedFromJson = (type: AutomationTaskTypeValue, sourceJson: string, publishJson: string) => {
    const parsedSource = safeParseJson(sourceJson);
    const parsedPublish = safeParseJson(publishJson);

    const nextSource = defaultGuidedSource(type);
    if (parsedSource && typeof parsedSource === "object") {
      const searchTerms = Array.isArray((parsedSource as any).searchTerms) ? (parsedSource as any).searchTerms : [];
      const cleanedTerms = searchTerms.map((t: any) => String(t || "").trim()).filter(Boolean);
      nextSource.searchTerms = cleanedTerms.length > 0 ? cleanedTerms : nextSource.searchTerms;
      if (Number.isFinite(Number((parsedSource as any).limit))) nextSource.limit = Number((parsedSource as any).limit);
      if (Number.isFinite(Number((parsedSource as any).minPrice))) nextSource.minPrice = Number((parsedSource as any).minPrice);
      if ((parsedSource as any).maxPrice === null || (parsedSource as any).maxPrice === undefined || (parsedSource as any).maxPrice === "") {
        nextSource.maxPrice = null;
      } else if (Number.isFinite(Number((parsedSource as any).maxPrice))) {
        nextSource.maxPrice = Number((parsedSource as any).maxPrice);
      }
      if (Number.isFinite(Number((parsedSource as any).minCommissionRate))) nextSource.minCommissionRate = Number((parsedSource as any).minCommissionRate);
      if (Number.isFinite(Number((parsedSource as any).minSales))) nextSource.minSales = Number((parsedSource as any).minSales);
    }
    setGuidedSource(nextSource);
    setSearchTermInput("");

    const nextPublish = defaultGuidedPublish();
    if (parsedPublish && typeof parsedPublish === "object") {
      nextPublish.platforms = normalizePlatforms((parsedPublish as any).platforms);
      nextPublish.timeSlots = normalizeTimeSlots(Array.isArray((parsedPublish as any).timeSlots) ? (parsedPublish as any).timeSlots : nextPublish.timeSlots);
      nextPublish.autoPost = Boolean((parsedPublish as any).autoPost ?? false);
    }
    setGuidedPublish(nextPublish);
  };

  useEffect(() => {
    if (!taskId) return;
    const load = async () => {
      setLoading(true);
      setMessage(null);
      try {
        const res = await fetch(`/api/tasks/${taskId}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Falha ao carregar task");
        const parsed = parseServerTask(data);
        setForm(parsed);
        syncGuidedFromJson(parsed.type, parsed.sourceConfigJson, parsed.publishConfigJson);
      } catch (error: any) {
        setMessage({ type: "error", text: error?.message || "Falha ao carregar task" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [taskId]);

  const title = useMemo(() => (taskId ? "Editar Task" : "Nova Task"), [taskId]);

  const patchForm = (patch: Partial<TaskRecord>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const handleTypeChange = (value: string) => {
    const nextType = normalizeTaskType(value);
    const defaults = DEFAULT_TASK_CONFIGS[nextType];
    const nextGuidedSource = defaultGuidedSource(nextType);
    const nextGuidedPublish = defaultGuidedPublish();
    patchForm({
      type: nextType,
      sourceConfigJson: buildSourceConfigJson(nextType, nextGuidedSource),
      creativeConfigJson: safeJsonStringify(defaults.creativeConfig),
      publishConfigJson: buildPublishConfigJson(nextGuidedPublish),
      executionConfigJson: safeJsonStringify(defaults.executionConfig),
    });
    setGuidedSource(nextGuidedSource);
    setGuidedPublish(nextGuidedPublish);
    setSearchTermInput("");
  };

  const togglePlatform = (platform: PublishPlatform) => {
    const current = new Set(guidedPublish.platforms || []);
    if (current.has(platform)) current.delete(platform);
    else current.add(platform);
    const next = Array.from(current);
    setGuidedPublish((cur) => ({ ...cur, platforms: next }));
    patchForm({ publishConfigJson: buildPublishConfigJson({ ...guidedPublish, platforms: next }) });
  };

  const addTimeSlot = () => {
    const next = normalizeTimeSlots([...(guidedPublish.timeSlots || []), timeSlotInput]);
    setGuidedPublish((cur) => ({ ...cur, timeSlots: next }));
    setTimeSlotInput("");
    patchForm({ publishConfigJson: buildPublishConfigJson({ ...guidedPublish, timeSlots: next }) });
  };

  const addSearchTerm = (raw: string) => {
    const term = String(raw || "").trim();
    if (!term) return;
    const next = Array.from(new Set([...(guidedSource.searchTerms || []), term])).slice(0, 20);
    const updated = { ...guidedSource, searchTerms: next };
    setGuidedSource(updated);
    setSearchTermInput("");
    patchForm({ sourceConfigJson: buildSourceConfigJson(form.type, updated) });
  };

  const removeSearchTerm = (term: string) => {
    const next = (guidedSource.searchTerms || []).filter((t) => t !== term);
    const updated = { ...guidedSource, searchTerms: next.length > 0 ? next : [] };
    setGuidedSource(updated);
    patchForm({ sourceConfigJson: buildSourceConfigJson(form.type, updated) });
  };

  const removeTimeSlot = (slot: string) => {
    const next = normalizeTimeSlots((guidedPublish.timeSlots || []).filter((v) => v !== slot));
    setGuidedPublish((cur) => ({ ...cur, timeSlots: next }));
    patchForm({ publishConfigJson: buildPublishConfigJson({ ...guidedPublish, timeSlots: next }) });
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const sourceConfigJson = advanced ? form.sourceConfigJson : buildSourceConfigJson(form.type, guidedSource);
      const publishConfigJson = advanced ? form.publishConfigJson : buildPublishConfigJson(guidedPublish);

      const payload = {
        name: form.name,
        slug: form.slug || slugifyTaskName(form.name),
        type: form.type,
        status: form.status,
        isEnabled: form.isEnabled,
        timezone: form.timezone,
        cronExpression: form.cronExpression || null,
        runIntervalMinutes: form.runIntervalMinutes || null,
        maxRunsPerDay: form.maxRunsPerDay || null,
        priority: form.priority || "100",
        creativeTemplateId: form.creativeTemplateId || null,
        sourceConfig: JSON.parse(sourceConfigJson || "{}"),
        creativeConfig: JSON.parse(form.creativeConfigJson || "{}"),
        publishConfig: JSON.parse(publishConfigJson || "{}"),
        executionConfig: JSON.parse(form.executionConfigJson || "{}"),
      };

      const res = await fetch(taskId ? `/api/tasks/${taskId}` : "/api/tasks", {
        method: taskId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao salvar task");

      setMessage({ type: "success", text: "Task salva com sucesso." });
      if (!taskId) {
        router.push(`/admin/tasks/${data.id}`);
        router.refresh();
      } else {
        const parsed = parseServerTask(data);
        setForm(parsed);
        syncGuidedFromJson(parsed.type, parsed.sourceConfigJson, parsed.publishConfigJson);
        router.refresh();
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message || "Falha ao salvar task" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Typography>Carregando task...</Typography>;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          {title}
        </Typography>
        <Typography sx={{ opacity: 0.8, mt: 1 }}>
          Dica: comece pelo modo simples. O modo avancado (JSON) fica disponivel para ajustes finos.
        </Typography>
      </Box>

      {message ? <Alert severity={message.type}>{message.text}</Alert> : null}

      <Paper sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 900, mb: 2 }}>1. Geral</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
            <TextField fullWidth label="Nome" value={form.name} onChange={(e) => patchForm({ name: e.target.value })} />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
            <TextField
              fullWidth
              label="Slug"
              value={form.slug}
              onChange={(e) => patchForm({ slug: e.target.value })}
              helperText="Se vazio, geramos automaticamente a partir do nome."
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
            <TextField select fullWidth label="Tipo" value={form.type} onChange={(e) => handleTypeChange(e.target.value)}>
              {AUTOMATION_TASK_TYPES.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
            <TextField
              select
              fullWidth
              label="Status"
              value={form.status}
              onChange={(e) => patchForm({ status: e.target.value as AutomationTaskStatusValue })}
            >
              {AUTOMATION_TASK_STATUSES.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" }, display: "flex", alignItems: "center" }}>
            <FormControlLabel
              control={<Switch checked={form.isEnabled} onChange={(e) => patchForm({ isEnabled: e.target.checked })} />}
              label="Task habilitada"
            />
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 900, mb: 2 }}>2. Execucao</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
            <TextField fullWidth label="Timezone" value={form.timezone} onChange={(e) => patchForm({ timezone: e.target.value })} />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
            <TextField fullWidth label="Cron expression (opcional)" value={form.cronExpression} onChange={(e) => patchForm({ cronExpression: e.target.value })} />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 2" } }}>
            <TextField fullWidth label="Intervalo (min)" value={form.runIntervalMinutes} onChange={(e) => patchForm({ runIntervalMinutes: e.target.value })} />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 2" } }}>
            <TextField fullWidth label="Max/dia" value={form.maxRunsPerDay} onChange={(e) => patchForm({ maxRunsPerDay: e.target.value })} />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 2" } }}>
            <TextField fullWidth label="Prioridade" value={form.priority} onChange={(e) => patchForm({ priority: e.target.value })} />
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <Box>
            <Typography sx={{ fontWeight: 900 }}>3. Fonte e Publicacao</Typography>
            <Typography sx={{ opacity: 0.75, mt: 0.5, fontSize: 13 }}>
              Modo simples = campos. Modo avancado = JSON (para quem quiser).
            </Typography>
          </Box>
          <FormControlLabel
            control={<Switch checked={advanced} onChange={(e) => setAdvanced(e.target.checked)} />}
            label={advanced ? "Modo avancado (JSON)" : "Modo simples"}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {!advanced ? (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
            <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
              <Typography sx={{ fontWeight: 900, mb: 1 }}>Source (o que buscar)</Typography>
              <Typography sx={{ opacity: 0.75, fontSize: 13, mb: 1 }}>
                Termos de busca = palavras-chave do produto. Se você colocar vários, a cada execução escolhemos 1 termo.
              </Typography>

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography sx={{ fontWeight: 800, mb: 1 }}>Termos (searchTerms)</Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                  {(guidedSource.searchTerms || []).map((term) => (
                    <Chip key={term} label={term} onDelete={() => removeSearchTerm(term)} />
                  ))}
                  {(guidedSource.searchTerms || []).length === 0 ? (
                    <Typography sx={{ opacity: 0.6, fontSize: 13 }}>Nenhum termo. Se vazio, usamos "ofertas".</Typography>
                  ) : null}
                </Box>

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <TextField
                    label="Adicionar termo"
                    value={searchTermInput}
                    onChange={(e) => setSearchTermInput(e.target.value)}
                    placeholder={form.type === "SHOPEE_VIDEO" ? "fone bluetooth" : "notebook"}
                    size="small"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSearchTerm(searchTermInput);
                      }
                    }}
                  />
                  <Button variant="outlined" onClick={() => addSearchTerm(searchTermInput)} disabled={!searchTermInput.trim()}>
                    Adicionar
                  </Button>
                </Box>

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
                  {(SEARCH_TERM_PRESETS[form.type] || []).map((preset) => (
                    <Button key={preset} size="small" variant="text" onClick={() => addSearchTerm(preset)}>
                      + {preset}
                    </Button>
                  ))}
                </Box>
              </Paper>

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2, mt: 2 }}>
                <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Qtd itens (limit)"
                    value={guidedSource.limit}
                    onChange={(e) => {
                      const next = { ...guidedSource, limit: Number(e.target.value || 0) };
                      setGuidedSource(next);
                      patchForm({ sourceConfigJson: buildSourceConfigJson(form.type, next) });
                    }}
                    helperText="Quantos produtos buscar por execucao (1-50)."
                  />
                </Box>
                <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Preco min (R$)"
                    value={guidedSource.minPrice}
                    onChange={(e) => {
                      const next = { ...guidedSource, minPrice: Number(e.target.value || 0) };
                      setGuidedSource(next);
                      patchForm({ sourceConfigJson: buildSourceConfigJson(form.type, next) });
                    }}
                    helperText="Filtra produtos abaixo desse valor."
                  />
                </Box>
                {form.type === "MERCADO_LIVRE_VIDEO" ? (
                  <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Preco max (R$)"
                      value={guidedSource.maxPrice ?? ""}
                      onChange={(e) => {
                        const next = { ...guidedSource, maxPrice: e.target.value === "" ? null : Number(e.target.value) };
                        setGuidedSource(next);
                        patchForm({ sourceConfigJson: buildSourceConfigJson(form.type, next) });
                      }}
                      helperText="Opcional. Se vazio, sem teto."
                    />
                  </Box>
                ) : null}
              </Box>

              {form.type === "SHOPEE_VIDEO" ? (
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2, mt: 2 }}>
                  <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Comissao min (%)"
                      value={guidedSource.minCommissionRate}
                      onChange={(e) => {
                        const next = { ...guidedSource, minCommissionRate: Number(e.target.value || 0) };
                        setGuidedSource(next);
                        patchForm({ sourceConfigJson: buildSourceConfigJson(form.type, next) });
                      }}
                      helperText="Ex.: 5 = 5% (filtra ofertas com baixa comissao)."
                    />
                  </Box>
                  <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Vendas min"
                      value={guidedSource.minSales}
                      onChange={(e) => {
                        const next = { ...guidedSource, minSales: Number(e.target.value || 0) };
                        setGuidedSource(next);
                        patchForm({ sourceConfigJson: buildSourceConfigJson(form.type, next) });
                      }}
                      helperText="Filtra produtos com pouco historico de vendas."
                    />
                  </Box>
                </Box>
              ) : null}
            </Box>

            <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
              <Typography sx={{ fontWeight: 900, mb: 1 }}>Publicacao (onde/quando)</Typography>
              <Typography sx={{ opacity: 0.75, fontSize: 13, mb: 1 }}>
                Horarios do dia definem quando o cron cria execucoes. Depois o cron social publica os posts agendados.
              </Typography>

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography sx={{ fontWeight: 800, mb: 1 }}>Plataformas</Typography>
                {(["YOUTUBE", "TIKTOK", "INSTAGRAM_REELS", "INSTAGRAM_STORIES"] as PublishPlatform[]).map((p) => (
                  <FormControlLabel
                    key={p}
                    control={<Checkbox checked={(guidedPublish.platforms || []).includes(p)} onChange={() => togglePlatform(p)} />}
                    label={p}
                  />
                ))}
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                <Typography sx={{ fontWeight: 800, mb: 1 }}>Horarios (timeSlots)</Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                  {(guidedPublish.timeSlots || []).map((slot) => (
                    <Chip key={slot} label={slot} onDelete={() => removeTimeSlot(slot)} />
                  ))}
                </Box>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <TextField
                    label="Adicionar (HH:MM)"
                    value={timeSlotInput}
                    onChange={(e) => setTimeSlotInput(e.target.value)}
                    placeholder="08:00"
                    size="small"
                  />
                  <Button variant="outlined" onClick={addTimeSlot} disabled={!timeSlotInput.trim()}>
                    Adicionar
                  </Button>
                </Box>
              </Paper>

              <FormControlLabel
                sx={{ mt: 2 }}
                control={
                  <Switch
                    checked={guidedPublish.autoPost}
                    onChange={(e) => {
                      const next = { ...guidedPublish, autoPost: e.target.checked };
                      setGuidedPublish(next);
                      patchForm({ publishConfigJson: buildPublishConfigJson(next) });
                    }}
                  />
                }
                label="Auto-post (flag)"
              />
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
            <Box sx={{ gridColumn: { xs: "span 12", lg: "span 6" } }}>
              <TextField
                fullWidth
                label="sourceConfig (JSON)"
                value={form.sourceConfigJson}
                onChange={(e) => patchForm({ sourceConfigJson: e.target.value })}
                multiline
                minRows={10}
                helperText="Dica: searchTerms e um array; hoje usamos o primeiro termo como keyword."
              />
            </Box>
            <Box sx={{ gridColumn: { xs: "span 12", lg: "span 6" } }}>
              <TextField
                fullWidth
                label="publishConfig (JSON)"
                value={form.publishConfigJson}
                onChange={(e) => patchForm({ publishConfigJson: e.target.value })}
                multiline
                minRows={10}
                helperText='Ex.: {"platforms":["YOUTUBE"],"timeSlots":["08:00","14:00"]}'
              />
            </Box>
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 900, mb: 2 }}>4. Avancado (video/execucao)</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
          <Box sx={{ gridColumn: { xs: "span 12", lg: "span 6" } }}>
            <TextField fullWidth label="creativeConfig (JSON)" value={form.creativeConfigJson} onChange={(e) => patchForm({ creativeConfigJson: e.target.value })} multiline minRows={10} />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", lg: "span 6" } }}>
            <TextField fullWidth label="executionConfig (JSON)" value={form.executionConfigJson} onChange={(e) => patchForm({ executionConfigJson: e.target.value })} multiline minRows={10} />
          </Box>
        </Box>
      </Paper>

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Button variant="contained" disabled={saving} onClick={save}>
          Salvar task
        </Button>
        <Button variant="outlined" onClick={() => router.push("/admin/tasks")}>
          Voltar para lista
        </Button>
      </Box>
    </Box>
  );
}

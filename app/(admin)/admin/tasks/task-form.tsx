"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, MenuItem, Paper, Switch, TextField, Typography, FormControlLabel } from "@mui/material";
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
  const [loading, setLoading] = useState(Boolean(taskId));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    if (!taskId) return;
    const load = async () => {
      setLoading(true);
      setMessage(null);
      try {
        const res = await fetch(`/api/tasks/${taskId}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Falha ao carregar task");
        setForm(parseServerTask(data));
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
    patchForm({
      type: nextType,
      sourceConfigJson: safeJsonStringify(defaults.sourceConfig),
      creativeConfigJson: safeJsonStringify(defaults.creativeConfig),
      publishConfigJson: safeJsonStringify(defaults.publishConfig),
      executionConfigJson: safeJsonStringify(defaults.executionConfig),
    });
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
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
        sourceConfig: JSON.parse(form.sourceConfigJson || "{}"),
        creativeConfig: JSON.parse(form.creativeConfigJson || "{}"),
        publishConfig: JSON.parse(form.publishConfigJson || "{}"),
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
        setForm(parseServerTask(data));
        router.refresh();
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message || "Falha ao salvar task" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Typography>Carregando task...</Typography>;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>{title}</Typography>
        <Typography sx={{ opacity: 0.8, mt: 1 }}>
          Configure a rotina central da automação. Depois vamos plugar Shopee, Mercado Livre, notícias e perguntas nesse mesmo padrão.
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
                <MenuItem key={item} value={item}>{item}</MenuItem>
              ))}
            </TextField>
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
            <TextField select fullWidth label="Status" value={form.status} onChange={(e) => patchForm({ status: e.target.value as AutomationTaskStatusValue })}>
              {AUTOMATION_TASK_STATUSES.map((item) => (
                <MenuItem key={item} value={item}>{item}</MenuItem>
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
        <Typography sx={{ fontWeight: 900, mb: 2 }}>2. Execução</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
            <TextField fullWidth label="Timezone" value={form.timezone} onChange={(e) => patchForm({ timezone: e.target.value })} />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
            <TextField fullWidth label="Cron expression" value={form.cronExpression} onChange={(e) => patchForm({ cronExpression: e.target.value })} />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 2" } }}>
            <TextField fullWidth label="Intervalo (min)" value={form.runIntervalMinutes} onChange={(e) => patchForm({ runIntervalMinutes: e.target.value })} />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 2" } }}>
            <TextField fullWidth label="Máx/dia" value={form.maxRunsPerDay} onChange={(e) => patchForm({ maxRunsPerDay: e.target.value })} />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 2" } }}>
            <TextField fullWidth label="Prioridade" value={form.priority} onChange={(e) => patchForm({ priority: e.target.value })} />
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 900, mb: 2 }}>3. Configs JSON</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
          <Box sx={{ gridColumn: { xs: "span 12", lg: "span 6" } }}>
            <TextField fullWidth label="sourceConfig" value={form.sourceConfigJson} onChange={(e) => patchForm({ sourceConfigJson: e.target.value })} multiline minRows={10} />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", lg: "span 6" } }}>
            <TextField fullWidth label="creativeConfig" value={form.creativeConfigJson} onChange={(e) => patchForm({ creativeConfigJson: e.target.value })} multiline minRows={10} />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", lg: "span 6" } }}>
            <TextField
              fullWidth
              label="publishConfig"
              value={form.publishConfigJson}
              onChange={(e) => patchForm({ publishConfigJson: e.target.value })}
              multiline
              minRows={10}
              helperText='Dica: use {"platforms":[...],"timeSlots":["08:00","14:00","20:00"]} para horários reais.'
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", lg: "span 6" } }}>
            <TextField fullWidth label="executionConfig" value={form.executionConfigJson} onChange={(e) => patchForm({ executionConfigJson: e.target.value })} multiline minRows={10} />
          </Box>
        </Box>
      </Paper>

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Button variant="contained" disabled={saving} onClick={save}>Salvar task</Button>
        <Button variant="outlined" onClick={() => router.push("/admin/tasks")}>Voltar para lista</Button>
      </Box>
    </Box>
  );
}

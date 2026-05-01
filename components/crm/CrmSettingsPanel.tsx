"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Button, Paper, Stack, Switch, TextField, Typography, FormControlLabel } from "@mui/material";

type Settings = {
  whatsappEnabled: boolean;
  whatsappDisplayLabel: string;
  whatsappNumber: string;
  whatsappDefaultMessage: string;
  evolutionEnabled: boolean;
  evolutionBaseUrl: string;
  evolutionApiKey: string;
  evolutionInstanceName: string;
  evolutionWebhookSecret: string;
  openAiModel: string;
  assistantEnabled: boolean;
  assistantScope: string;
  assistantSystemPrompt: string;
};

const DEFAULT_SETTINGS: Settings = {
  whatsappEnabled: false,
  whatsappDisplayLabel: "Falar no WhatsApp",
  whatsappNumber: "",
  whatsappDefaultMessage: "Olá! Quero falar sobre automação, agentes de IA e WhatsApp.",
  evolutionEnabled: false,
  evolutionBaseUrl: "",
  evolutionApiKey: "",
  evolutionInstanceName: "",
  evolutionWebhookSecret: "",
  openAiModel: "gpt-4o-mini",
  assistantEnabled: true,
  assistantScope: "Automação com n8n, agentes de IA, RAG, WhatsApp, Evolution API, integrações e implantação comercial.",
  assistantSystemPrompt:
    "Você é um atendente comercial da Plugando IA. Tire dúvidas apenas sobre automação, n8n, agentes de IA, RAG, WhatsApp, Evolution API, integrações, implantação e consultoria.",
};

export default function CrmSettingsPanel() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function load() {
    const res = await fetch("/api/crm/settings");
    if (res.ok) {
      const data = await res.json();
      setSettings({
        whatsappEnabled: data.whatsappEnabled,
        whatsappDisplayLabel: data.whatsappDisplayLabel,
        whatsappNumber: data.whatsappNumber || "",
        whatsappDefaultMessage: data.whatsappDefaultMessage,
        evolutionEnabled: data.evolutionEnabled,
        evolutionBaseUrl: data.evolutionBaseUrl || "",
        evolutionApiKey: data.evolutionApiKey || "",
        evolutionInstanceName: data.evolutionInstanceName || "",
        evolutionWebhookSecret: data.evolutionWebhookSecret || "",
        openAiModel: data.openAiModel,
        assistantEnabled: data.assistantEnabled,
        assistantScope: data.assistantScope,
        assistantSystemPrompt: data.assistantSystemPrompt,
      });
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    setSaving(true);
    setFeedback(null);
    const res = await fetch("/api/crm/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);

    if (!res.ok) {
      setFeedback({ type: "error", text: "Não consegui salvar as configurações." });
      return;
    }

    setFeedback({ type: "success", text: "Configurações do CRM salvas." });
    await load();
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Configurações do CRM</Typography>
        <Typography color="text.secondary">
          Cadastre aqui o canal comercial, dados da Evolution API e política do atendente IA.
        </Typography>
      </Box>

      {feedback && <Alert severity={feedback.type}>{feedback.text}</Alert>}

      <Paper sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>WhatsApp público</Typography>
        <Stack spacing={1.5}>
          <FormControlLabel
            control={<Switch checked={settings.whatsappEnabled} onChange={(e) => setSettings((prev) => ({ ...prev, whatsappEnabled: e.target.checked }))} />}
            label="Habilitar CTA público"
          />
          <TextField label="Texto do botão" value={settings.whatsappDisplayLabel} onChange={(e) => setSettings((prev) => ({ ...prev, whatsappDisplayLabel: e.target.value }))} />
          <TextField label="Número do WhatsApp" value={settings.whatsappNumber} onChange={(e) => setSettings((prev) => ({ ...prev, whatsappNumber: e.target.value }))} />
          <TextField label="Mensagem padrão" multiline minRows={3} value={settings.whatsappDefaultMessage} onChange={(e) => setSettings((prev) => ({ ...prev, whatsappDefaultMessage: e.target.value }))} />
        </Stack>
      </Paper>

      <Paper sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Evolution API</Typography>
        <Stack spacing={1.5}>
          <FormControlLabel
            control={<Switch checked={settings.evolutionEnabled} onChange={(e) => setSettings((prev) => ({ ...prev, evolutionEnabled: e.target.checked }))} />}
            label="Habilitar integração Evolution"
          />
          <TextField label="Base URL" value={settings.evolutionBaseUrl} onChange={(e) => setSettings((prev) => ({ ...prev, evolutionBaseUrl: e.target.value }))} />
          <TextField label="API Key" value={settings.evolutionApiKey} onChange={(e) => setSettings((prev) => ({ ...prev, evolutionApiKey: e.target.value }))} />
          <TextField label="Instance name" value={settings.evolutionInstanceName} onChange={(e) => setSettings((prev) => ({ ...prev, evolutionInstanceName: e.target.value }))} />
          <TextField label="Webhook secret" value={settings.evolutionWebhookSecret} onChange={(e) => setSettings((prev) => ({ ...prev, evolutionWebhookSecret: e.target.value }))} />
        </Stack>
      </Paper>

      <Paper sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Atendente IA</Typography>
        <Stack spacing={1.5}>
          <FormControlLabel
            control={<Switch checked={settings.assistantEnabled} onChange={(e) => setSettings((prev) => ({ ...prev, assistantEnabled: e.target.checked }))} />}
            label="Habilitar respostas assistidas"
          />
          <TextField label="Modelo OpenAI" value={settings.openAiModel} onChange={(e) => setSettings((prev) => ({ ...prev, openAiModel: e.target.value }))} />
          <TextField label="Escopo atendido" multiline minRows={3} value={settings.assistantScope} onChange={(e) => setSettings((prev) => ({ ...prev, assistantScope: e.target.value }))} />
          <TextField label="Prompt do sistema" multiline minRows={6} value={settings.assistantSystemPrompt} onChange={(e) => setSettings((prev) => ({ ...prev, assistantSystemPrompt: e.target.value }))} />
        </Stack>
      </Paper>

      <Box>
        <Button variant="contained" onClick={save} disabled={saving}>
          {saving ? "Salvando..." : "Salvar configurações"}
        </Button>
      </Box>
    </Stack>
  );
}

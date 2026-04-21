"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Paper, TextField, Button, Switch, FormControlLabel, Alert, Divider } from "@mui/material";

export default function IntegrationsPage() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    fetch("/api/integrations")
      .then(r => r.json())
      .then(data => {
        const n8n = data.find((d: any) => d.platform === "N8N");
        if (n8n) {
          setWebhookUrl(n8n.webhookUrl || "");
          setIsActive(n8n.isActive);
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "N8N",
          webhookUrl,
          isActive
        })
      });

      if (!res.ok) throw new Error("Erro ao salvar.");
      setMsg({ type: "success", text: "Integração N8N configurada com sucesso!" });
    } catch(err) {
       setMsg({ type: "error", text: "Falha na conexão com o banco." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Typography>Carregando integrações...</Typography>;

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 4 }}>Hub de Integrações</Typography>

      {msg.text && (
        <Alert severity={msg.type as any} sx={{ mb: 3 }}>{msg.text}</Alert>
      )}

      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight="bold" color="#c00000">Motor N8N / Make</Typography>
            <Typography variant="body2" color="textSecondary">
              Configure a URL de Webhook para escutar quando um artigo for PUBLISHED no Portal.
            </Typography>
          </Box>
          <FormControlLabel
            control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} color="primary" />}
            label={isActive ? "Ativado" : "Desligado"}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        <TextField 
          label="Webhook URL (Production ou Test)"
          fullWidth
          variant="outlined"
          placeholder="https://sua-instancia-n8n.com/webhook/post-recebido"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          disabled={!isActive}
          sx={{ mb: 3 }}
        />

        <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 2, mb: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold">Payload de Disparo JSON:</Typography>
          <Typography variant="caption" component="pre" sx={{ mt: 1, color: '#333', overflowX: 'auto' }}>
{`{
  "event": "POST_PUBLISHED",
  "data": {
    "title": "...",
    "summary": "...",
    "content": "<p>...</p>",
    "coverImage": "https://minio...",
    "post_url": "https://seuportal.com/noticias/slug"
  }
}`}
          </Typography>
        </Box>

        <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ bgcolor: '#1a1a1a', textTransform: 'none' }}>
          {saving ? "Salvando..." : "Salvar Configuração Webhook"}
        </Button>
      </Paper>
    </Box>
  );
}

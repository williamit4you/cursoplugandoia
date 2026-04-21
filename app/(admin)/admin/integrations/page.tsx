"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Paper, TextField, Button, Switch, FormControlLabel, Alert, Divider } from "@mui/material";

export default function IntegrationsPage() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isActive, setIsActive] = useState(false);
  
  // Meta Settings
  const [metaAppId, setMetaAppId] = useState("");
  const [metaAppSecret, setMetaAppSecret] = useState("");
  const [metaPageId, setMetaPageId] = useState("");
  const [metaInstagramId, setMetaInstagramId] = useState("");
  const [metaAccessToken, setMetaAccessToken] = useState("");

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

        const meta = data.find((d: any) => d.platform === "META");
        if (meta) {
          setMetaAppId(meta.appId || "");
          setMetaAppSecret(meta.apiSecret || "");
          setMetaPageId(meta.pageId || "");
          setMetaInstagramId(meta.instagramId || "");
          setMetaAccessToken(meta.accessToken || "");
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

  const handleSaveMeta = async () => {
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "META",
          appId: metaAppId,
          apiSecret: metaAppSecret,
          pageId: metaPageId,
          instagramId: metaInstagramId,
          accessToken: metaAccessToken,
          isActive: true
        })
      });

      if (!res.ok) throw new Error("Erro ao salvar configurações da Meta.");
      setMsg({ type: "success", text: "Configurações da Meta salvas com sucesso!" });
    } catch(err: any) {
       setMsg({ type: "error", text: err.message || "Falha ao salvar." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Typography>Carregando integrações...</Typography>;

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 4 }}>Hub de Integrações</Typography>

      {msg.text && (
        <Alert severity={msg.type as any} sx={{ mb: 3 }}>{msg.text}</Alert>
      )}

      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: "bold" }} color="#c00000">Motor N8N / Make</Typography>
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
          <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>Payload de Disparo JSON:</Typography>
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

      <Paper sx={{ p: 4, borderRadius: 2, mt: 4, mb: 6 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold" }} color="#c00000">Configurações Meta (Facebook/Instagram)</Typography>
          <Typography variant="body2" color="textSecondary">
            Insira as credenciais do seu App no Facebook Developers para habilitar a postagem automática de Stories.
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
          <TextField 
            label="App ID"
            fullWidth
            variant="outlined"
            size="small"
            value={metaAppId}
            onChange={(e) => setMetaAppId(e.target.value)}
          />
          <TextField 
            label="App Secret"
            fullWidth
            variant="outlined"
            size="small"
            type="password"
            value={metaAppSecret}
            onChange={(e) => setMetaAppSecret(e.target.value)}
          />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
          <TextField 
            label="Facebook Page ID"
            fullWidth
            variant="outlined"
            size="small"
            value={metaPageId}
            onChange={(e) => setMetaPageId(e.target.value)}
          />
          <TextField 
            label="Instagram Business Account ID"
            fullWidth
            variant="outlined"
            size="small"
            value={metaInstagramId}
            onChange={(e) => setMetaInstagramId(e.target.value)}
            helperText="Opcional se você usar o botão de busca automática (em breve)."
          />
        </Box>

        <TextField 
          label="User/Page Access Token (Long-lived)"
          fullWidth
          variant="outlined"
          multiline
          rows={3}
          placeholder="EAA..."
          value={metaAccessToken}
          onChange={(e) => setMetaAccessToken(e.target.value)}
          sx={{ mb: 3 }}
        />

        <Button variant="contained" onClick={handleSaveMeta} disabled={saving} sx={{ bgcolor: '#1a1a1a', textTransform: 'none' }}>
          {saving ? "Salvando..." : "Salvar Configurações Meta"}
        </Button>
      </Paper>
    </Box>
  );
}

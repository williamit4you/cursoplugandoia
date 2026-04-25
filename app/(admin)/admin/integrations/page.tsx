"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Paper, TextField, Button, Switch, FormControlLabel, Alert, Divider } from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function IntegrationsPage() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isActive, setIsActive] = useState(false);
  
  // Meta Settings
  const [metaAppId, setMetaAppId] = useState("");
  const [metaAppSecret, setMetaAppSecret] = useState("");
  const [metaPageId, setMetaPageId] = useState("");
  const [metaInstagramId, setMetaInstagramId] = useState("");
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [metaAccounts, setMetaAccounts] = useState<any[]>([]);
  const [discovering, setDiscovering] = useState(false);

  // TikTok Settings
  const [tiktokClientKey, setTiktokClientKey] = useState("");
  const [tiktokClientSecret, setTiktokClientSecret] = useState("");
  const [tiktokAccessToken, setTiktokAccessToken] = useState("");
  const [tiktokActive, setTiktokActive] = useState(false);

  // LinkedIn Settings
  const [linkedinToken, setLinkedinToken] = useState("");
  const [linkedinPersonUrn, setLinkedinPersonUrn] = useState("");
  const [linkedinOrgUrn, setLinkedinOrgUrn] = useState("");
  const [linkedinActive, setLinkedinActive] = useState(false);

  // YouTube Settings
  const [youtubeClientId, setYoutubeClientId] = useState("");
  const [youtubeClientSecret, setYoutubeClientSecret] = useState("");
  const [youtubeRefreshToken, setYoutubeRefreshToken] = useState("");
  const [youtubeActive, setYoutubeActive] = useState(false);

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

        const tiktok = data.find((d: any) => d.platform === "TIKTOK");
        if (tiktok) {
          setTiktokClientKey(tiktok.apiKey || "");
          setTiktokClientSecret(tiktok.apiSecret || "");
          setTiktokAccessToken(tiktok.accessToken || "");
          setTiktokActive(tiktok.isActive);
        }

        const linkedin = data.find((d: any) => d.platform === "LINKEDIN");
        if (linkedin) {
          setLinkedinToken(linkedin.accessToken || "");
          setLinkedinPersonUrn(linkedin.instagramId || "");
          setLinkedinOrgUrn(linkedin.pageId || "");
          setLinkedinActive(linkedin.isActive);
        }

        const youtube = data.find((d: any) => d.platform === "YOUTUBE");
        if (youtube) {
          setYoutubeClientId(youtube.apiKey || "");
          setYoutubeClientSecret(youtube.apiSecret || "");
          setYoutubeRefreshToken(youtube.refreshToken || "");
          setYoutubeActive(youtube.isActive);
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
        body: JSON.stringify({ platform: "N8N", webhookUrl, isActive })
      });
      if (!res.ok) throw new Error("Erro ao salvar.");
      toast.success("Integração N8N configurada com sucesso!");
    } catch(err) {
       toast.error("Falha na conexão com o banco.");
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
      toast.success("Configurações da Meta salvas com sucesso!");
    } catch(err: any) {
       toast.error(err.message || "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTikTok = async () => {
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "TIKTOK",
          apiKey: tiktokClientKey,
          apiSecret: tiktokClientSecret,
          accessToken: tiktokAccessToken,
          isActive: tiktokActive,
        }),
      });
      if (!res.ok) throw new Error("Erro ao salvar TikTok.");
      toast.success("TikTok configurado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Falha ao salvar TikTok.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLinkedIn = async () => {
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "LINKEDIN",
          accessToken: linkedinToken,
          instagramId: linkedinPersonUrn,
          pageId: linkedinOrgUrn,
          isActive: linkedinActive,
        }),
      });
      if (!res.ok) throw new Error("Erro ao salvar LinkedIn.");
      toast.success("LinkedIn configurado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Falha ao salvar LinkedIn.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveYouTube = async () => {
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "YOUTUBE",
          apiKey: youtubeClientId,
          apiSecret: youtubeClientSecret,
          isActive: youtubeActive,
        }),
      });
      if (!res.ok) throw new Error("Erro ao salvar YouTube.");
      toast.success("Credenciais do YouTube salvas com sucesso! Agora você pode se autenticar.");
    } catch (err: any) {
      toast.error(err.message || "Falha ao salvar YouTube.");
    } finally {
      setSaving(false);
    }
  };

  const handleAuthYouTube = async () => {
    // Check if we can start auth (backend validation)
    try {
      const res = await fetch("/api/integrations/youtube/auth", { method: "GET", redirect: "manual" });
      if (res.status === 400) {
        const data = await res.json();
        toast.error(data.error || "Erro ao iniciar autenticação.");
        return;
      }
      window.location.href = "/api/integrations/youtube/auth";
    } catch (e) {
      toast.error("Erro ao conectar com o serviço de autenticação.");
    }
  };

  const handleDiscoverMeta = async () => {
    if (!metaAccessToken) {
        setMsg({ type: "error", text: "Insira o Access Token primeiro para descobrir os IDs." });
        return;
    }
    setDiscovering(true);
    setMsg({ type: "", text: "" });
    try {
      const res = await fetch("/api/social/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: metaAccessToken })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setMetaAccounts(data.accounts || []);
      if (data.accounts?.length > 0) {
          toast.success(`Encontradas ${data.accounts.length} contas vinculadas ao seu token!`);
      } else {
          toast.warn("Nenhuma página de Facebook encontrada para este token.");
      }
    } catch (err: any) {
       toast.error(err.message || "Erro na descoberta.");
    } finally {
      setDiscovering(false);
    }
  };

  if (loading) return <Typography>Carregando integrações...</Typography>;

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 4, pb: 10 }}>
      <ToastContainer position="top-right" autoClose={4000} />
      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 4 }}>Hub de Integrações</Typography>

      {msg.text && (
        <Alert severity={msg.type as any} sx={{ mb: 3 }}>{msg.text}</Alert>
      )}

      {/* ── N8N ── */}
      <Paper sx={{ p: 4, borderRadius: 2, mb: 4 }}>
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

      {/* ── META ── */}
      <Paper sx={{ p: 4, borderRadius: 2, mb: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold" }} color="#c00000">Configurações Meta (Facebook/Instagram)</Typography>
          <Typography variant="body2" color="textSecondary">
            Insira as credenciais do seu App no Facebook Developers para habilitar a postagem automática de Stories e Reels.
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
          <TextField label="App ID" fullWidth variant="outlined" size="small" value={metaAppId} onChange={(e) => setMetaAppId(e.target.value)} />
          <TextField label="App Secret" fullWidth variant="outlined" size="small" type="password" value={metaAppSecret} onChange={(e) => setMetaAppSecret(e.target.value)} />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
          <TextField label="Facebook Page ID" fullWidth variant="outlined" size="small" value={metaPageId} onChange={(e) => setMetaPageId(e.target.value)} />
          <TextField label="Instagram Business Account ID" fullWidth variant="outlined" size="small" value={metaInstagramId} onChange={(e) => setMetaInstagramId(e.target.value)} helperText="Opcional se usar busca automática abaixo." />
        </Box>

        <TextField 
          label="User/Page Access Token (Long-lived)"
          fullWidth variant="outlined" multiline rows={3}
          placeholder="EAA..."
          value={metaAccessToken}
          onChange={(e) => setMetaAccessToken(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Button 
          variant="outlined" onClick={handleDiscoverMeta}
          disabled={discovering || !metaAccessToken}
          sx={{ mb: 3, textTransform: 'none' }}
        >
          {discovering ? "Buscando..." : "🔍 Descobrir IDs Automaticamente"}
        </Button>

        {metaAccounts.length > 0 && (
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f0f4f8', borderRadius: 2, border: '1px solid #d1d5db' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Contas Encontradas:</Typography>
            {metaAccounts.map((acc, i) => (
                <Box key={i} sx={{ mb: 1.5, pb: 1, borderBottom: i !== metaAccounts.length - 1 ? '1px dashed #ccc' : 'none' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: acc.type === 'PAGE' ? '#c00000' : 'text.secondary' }}>
                      {acc.name} {acc.type === 'PAGE' ? '✅ RECOMENDADO' : ''}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                        <Box sx={{ cursor: 'pointer', '&:hover': { opacity: 0.7 } }} onClick={() => setMetaPageId(acc.pageId)}>
                            <Typography variant="caption" color="primary">ID da Página: {acc.pageId} (clique p/ usar)</Typography>
                        </Box>
                        {acc.instagramId !== "N/A" ? (
                          <Box sx={{ cursor: 'pointer', '&:hover': { opacity: 0.7 } }} onClick={() => setMetaInstagramId(acc.instagramId)}>
                              <Typography variant="caption" color="secondary">ID do Instagram: {acc.instagramId} (clique p/ usar)</Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.disabled">Sem Instagram vinculado</Typography>
                        )}
                    </Box>
                </Box>
            ))}
          </Box>
        )}

        <Box>
            <Button variant="contained" onClick={handleSaveMeta} disabled={saving} sx={{ bgcolor: '#1a1a1a', textTransform: 'none' }}>
                {saving ? "Salvando..." : "Salvar Configurações Meta"}
            </Button>
        </Box>
      </Paper>

      {/* ── TIKTOK ── */}
      <Paper sx={{ p: 4, borderRadius: 2, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: "bold" }} color="#010101">🎵 TikTok</Typography>
            <Typography variant="body2" color="textSecondary">
              Configure as credenciais do app TikTok para publicação automática de vídeos.{" "}
              <a href="https://developers.tiktok.com" target="_blank" rel="noreferrer" style={{ color: '#6366f1' }}>
                developers.tiktok.com
              </a>
            </Typography>
          </Box>
          <FormControlLabel
            control={<Switch checked={tiktokActive} onChange={(e) => setTiktokActive(e.target.checked)} color="primary" />}
            label={tiktokActive ? "Ativado" : "Desligado"}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
          <TextField
            label="Client Key"
            fullWidth variant="outlined" size="small"
            placeholder="awk..."
            value={tiktokClientKey}
            onChange={(e) => setTiktokClientKey(e.target.value)}
          />
          <TextField
            label="Client Secret"
            fullWidth variant="outlined" size="small" type="password"
            value={tiktokClientSecret}
            onChange={(e) => setTiktokClientSecret(e.target.value)}
          />
        </Box>

        <TextField
          label="Access Token (Long-lived)"
          fullWidth variant="outlined" multiline rows={3}
          placeholder="act..."
          value={tiktokAccessToken}
          onChange={(e) => setTiktokAccessToken(e.target.value)}
          helperText="Token de longa duração com escopo video.publish. Renovar a cada 90 dias."
          sx={{ mb: 3 }}
        />

        <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 2, mb: 3 }}>
          <Typography variant="body2" color="textSecondary" sx={{ fontSize: 12 }}>
            ℹ️ Usa a <strong>Content Posting API v2</strong> — método Direct Post via URL pull. Vídeos publicados ficam em revisão por ~24h antes de aparecer publicamente.
          </Typography>
        </Box>

        <Button variant="contained" onClick={handleSaveTikTok} disabled={saving} sx={{ bgcolor: '#010101', textTransform: 'none' }}>
          {saving ? "Salvando..." : "Salvar Configurações TikTok"}
        </Button>
      </Paper>

      {/* ── LINKEDIN ── */}
      <Paper sx={{ p: 4, borderRadius: 2, mb: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: "bold" }} color="#0A66C2">💼 LinkedIn</Typography>
            <Typography variant="body2" color="textSecondary">
              Configure o token LinkedIn para publicar posts com imagem de capa automaticamente.{" "}
              <a href="https://www.linkedin.com/developers" target="_blank" rel="noreferrer" style={{ color: '#0A66C2' }}>
                developers.linkedin.com
              </a>
            </Typography>
          </Box>
          <FormControlLabel
            control={<Switch checked={linkedinActive} onChange={(e) => setLinkedinActive(e.target.checked)} color="primary" />}
            label={linkedinActive ? "Ativado" : "Desligado"}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        <TextField
          label="Access Token (OAuth 2.0)"
          fullWidth variant="outlined" multiline rows={3}
          placeholder="AQV..."
          value={linkedinToken}
          onChange={(e) => setLinkedinToken(e.target.value)}
          helperText="Token OAuth com escopos: w_member_social (pessoa) ou w_organization_social (empresa)."
          sx={{ mb: 3 }}
        />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
          <TextField
            label="Person URN"
            fullWidth variant="outlined" size="small"
            placeholder="urn:li:person:ABC123"
            value={linkedinPersonUrn}
            onChange={(e) => setLinkedinPersonUrn(e.target.value)}
            helperText="Obrigatório. Consultar em /v2/me"
          />
          <TextField
            label="Organization URN (opcional)"
            fullWidth variant="outlined" size="small"
            placeholder="urn:li:organization:12345"
            value={linkedinOrgUrn}
            onChange={(e) => setLinkedinOrgUrn(e.target.value)}
            helperText="Se preenchido, publica pela empresa. Caso contrário, pelo perfil pessoal."
          />
        </Box>

        <Box sx={{ bgcolor: '#e8f0fe', p: 2, borderRadius: 2, mb: 3 }}>
          <Typography variant="body2" color="textSecondary" sx={{ fontSize: 12 }}>
            ℹ️ Usa a <strong>UGC Posts API v2</strong>. Posts incluem o texto do resumo + imagem de capa do Post + link para o artigo no portal.
          </Typography>
        </Box>

        <Button variant="contained" onClick={handleSaveLinkedIn} disabled={saving} sx={{ bgcolor: '#0A66C2', textTransform: 'none' }}>
          {saving ? "Salvando..." : "Salvar Configurações LinkedIn"}
        </Button>
      </Paper>

      {/* ── YOUTUBE ── */}
      <Paper sx={{ p: 4, borderRadius: 2, mb: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: "bold" }} color="#FF0000">▶️ YouTube</Typography>
            <Typography variant="body2" color="textSecondary">
              Configure as credenciais OAuth do Google para postar vídeos no seu canal.{" "}
              <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" style={{ color: '#FF0000' }}>
                Google Cloud Console
              </a>
            </Typography>
          </Box>
          <FormControlLabel
            control={<Switch checked={youtubeActive} onChange={(e) => setYoutubeActive(e.target.checked)} color="primary" />}
            label={youtubeActive ? "Ativado" : "Desligado"}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
          <TextField
            label="Client ID"
            fullWidth variant="outlined" size="small"
            placeholder="123456-abc.apps.googleusercontent.com"
            value={youtubeClientId}
            onChange={(e) => setYoutubeClientId(e.target.value)}
          />
          <TextField
            label="Client Secret"
            fullWidth variant="outlined" size="small" type="password"
            value={youtubeClientSecret}
            onChange={(e) => setYoutubeClientSecret(e.target.value)}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Button variant="contained" onClick={handleSaveYouTube} disabled={saving} sx={{ bgcolor: '#010101', textTransform: 'none' }}>
            {saving ? "Salvando..." : "Salvar Credenciais"}
          </Button>

          {youtubeRefreshToken ? (
            <Typography variant="body2" sx={{ color: 'green', fontWeight: 'bold' }}>
              ✅ Conta Autenticada
            </Typography>
          ) : (
            <Button
              variant="contained"
              onClick={handleAuthYouTube}
              disabled={!youtubeClientId || !youtubeClientSecret}
              sx={{ bgcolor: '#FF0000', '&:hover': { bgcolor: '#cc0000' }, textTransform: 'none' }}
            >
              Autenticar com o Google
            </Button>
          )}
        </Box>

        <Box sx={{ bgcolor: '#fef2f2', p: 2, borderRadius: 2, mb: 3 }}>
          <Typography variant="body2" color="textSecondary" sx={{ fontSize: 12 }}>
            ℹ️ Salve as credenciais primeiro e depois clique em &quot;Autenticar com o Google&quot; para autorizar o envio de vídeos para o seu canal. Não se esqueça de adicionar <strong>{typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/api/integrations/youtube/callback</strong> nas URIs de redirecionamento autorizadas no Google Cloud.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

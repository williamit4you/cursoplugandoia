"use client";

import { useState } from "react";
import { Box, Card, CardContent, Typography, Button, CircularProgress, Alert, Autocomplete, TextField, Grid, Chip } from "@mui/material";
import SmartToyIcon from '@mui/icons-material/SmartToy';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';

export default function YtAiInsights() {
  const [channels, setChannels] = useState<{id: string, name: string}[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<{id: string, name: string} | null>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchChannels = async (query: string) => {
    if (!query) return;
    try {
      const res = await fetch(`/api/youtube-analytics/channels?search=${query}&pageSize=10`);
      const data = await res.json();
      setChannels(data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadReport = async (channelId: string, forceGenerate = false) => {
    setLoading(true);
    setError("");
    try {
      const method = forceGenerate ? "POST" : "GET";
      const res = await fetch(`/api/youtube-analytics/ai-report/${channelId}`, { method });
      if (!res.ok) {
        if (res.status === 404 && !forceGenerate) {
          return loadReport(channelId, true);
        }
        throw new Error("Erro ao buscar relatório.");
      }
      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Card sx={{ mb: 4, p: 2, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToyIcon color="primary" /> Selecione um Canal para Análise
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Autocomplete
              options={channels}
              getOptionLabel={(option) => option.name}
              sx={{ width: 300 }}
              onInputChange={(e, val) => fetchChannels(val)}
              onChange={(e, val) => {
                setSelectedChannel(val);
                if (val) loadReport(val.id);
                else setReport(null);
              }}
              renderInput={(params) => <TextField {...params} label="Buscar canal..." size="small" />}
            />
            {selectedChannel && (
              <Button variant="outlined" onClick={() => loadReport(selectedChannel.id, true)} disabled={loading}>
                Refazer Análise (IA)
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 10 }}><CircularProgress /></Box>}
      {error && <Alert severity="error">{error}</Alert>}

      {report && !loading && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 4, bgcolor: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
                  Resumo Executivo
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '1.1rem', color: '#334155' }}>
                  {report.summary}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary' }}>
                  Gerado por {report.model} em {new Date(report.createdAt).toLocaleString()} • Custo: ${report.costUsd}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 4, height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Diagnóstico do Canal</Typography>
                <Typography variant="body2" paragraph>{report.insights?.diagnosis}</Typography>
                
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>Padrão de Conteúdo</Typography>
                <Typography variant="body2" paragraph>{report.insights?.contentPattern}</Typography>
                
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>Melhores Dias para Postar</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {(report.insights?.bestDays || []).map((day: string, idx: number) => (
                    <Chip key={idx} label={day} color="primary" variant="outlined" size="small" />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 4, height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TipsAndUpdatesIcon color="warning" /> Oportunidades & Ideias
                </Typography>
                
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>Ideias de Vídeos Virais</Typography>
                <ul style={{ paddingLeft: 20, margin: 0, fontSize: '0.875rem' }}>
                  {(report.recommendations?.viralTitles || []).map((t: string, i: number) => <li key={i}>{t}</li>)}
                </ul>

                <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>Sugestões de Melhoria</Typography>
                <ul style={{ paddingLeft: 20, margin: 0, fontSize: '0.875rem' }}>
                  {(report.recommendations?.improvements || []).map((t: string, i: number) => <li key={i}>{t}</li>)}
                </ul>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

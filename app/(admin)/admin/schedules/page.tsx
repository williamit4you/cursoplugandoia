"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Chip, MenuItem, Paper, TextField, Typography } from "@mui/material";

type ScheduleItem = {
  id: string;
  status: string;
  platform: string;
  postType: string;
  scheduledTo: string | null;
  postedAt: string | null;
  summary: string;
  videoUrl: string;
  thumbUrl: string | null;
  postUrl: string | null;
  automationTaskId: string | null;
  automationTaskRunId: string | null;
  createdAt: string;
};

export default function SchedulesPage() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState("ALL");
  const [platform, setPlatform] = useState("ALL");

  const load = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const qs = new URLSearchParams({ page: "1", pageSize: "100", status, platform });
      const res = await fetch(`/api/schedules?${qs.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao carregar agendamentos");
      setItems(data.items || []);
    } catch (error: any) {
      setMessage(error?.message || "Falha ao carregar agendamentos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>Agendamentos</Typography>
        <Typography sx={{ opacity: 0.8, mt: 1 }}>Posts criados pelas Automation Tasks (SocialPost).</Typography>
      </Box>

      {message ? <Alert severity="error">{message}</Alert> : null}

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
            <TextField select fullWidth label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
              {["ALL", "DRAFT", "SCHEDULED", "POSTED", "FAILED", "PROCESSING_MEDIA"].map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
            <TextField select fullWidth label="Plataforma" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {["ALL", "META", "YOUTUBE", "TIKTOK", "LINKEDIN"].map((p) => (
                <MenuItem key={p} value={p}>{p}</MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <button
            onClick={load}
            disabled={loading}
            style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 800, background: "#111827", color: "white" }}
          >
            Aplicar filtros
          </button>
        </Box>
      </Paper>

      <Paper sx={{ p: 0, overflow: "hidden" }}>
        <Box sx={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                {["Agendado", "Status", "Plataforma", "Resumo", "TaskRun"].map((label) => (
                  <th key={label} style={{ textAlign: "left", padding: 16, fontSize: 12 }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <td style={{ padding: 16 }}>
                    {item.scheduledTo ? new Date(item.scheduledTo).toLocaleString("pt-BR") : "—"}
                  </td>
                  <td style={{ padding: 16 }}>
                    <Chip label={item.status} size="small" color={item.status === "POSTED" ? "success" : item.status === "FAILED" ? "error" : "default"} />
                  </td>
                  <td style={{ padding: 16 }}>
                    <Chip label={`${item.platform}/${item.postType}`} size="small" variant="outlined" />
                  </td>
                  <td style={{ padding: 16, maxWidth: 520 }}>
                    <div style={{ fontWeight: 700 }}>{item.summary}</div>
                    <div style={{ opacity: 0.7, fontSize: 12 }}>{item.videoUrl}</div>
                  </td>
                  <td style={{ padding: 16 }}>
                    <div style={{ fontFamily: "monospace", fontSize: 12, opacity: 0.85 }}>
                      {item.automationTaskRunId || "—"}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 24, textAlign: "center", opacity: 0.7 }}>
                    Nenhum agendamento encontrado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Box>
      </Paper>
    </Box>
  );
}

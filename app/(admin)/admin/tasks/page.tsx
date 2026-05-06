"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Button, Chip, MenuItem, Paper, TextField, Typography } from "@mui/material";
import Link from "next/link";

type TaskListItem = {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  isEnabled: boolean;
  priority: number;
  nextRunAt?: string | null;
  lastRunAt?: string | null;
  updatedAt: string;
  runs?: Array<{
    id: string;
    status: string;
    createdAt: string;
    finishedAt?: string | null;
    errorMessage?: string | null;
  }>;
};

export default function TasksPage() {
  const [items, setItems] = useState<TaskListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [type, setType] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const query = new URLSearchParams();
      if (q.trim()) query.set("q", q.trim());
      if (type !== "ALL") query.set("type", type);
      if (status !== "ALL") query.set("status", status);

      const res = await fetch(`/api/tasks?${query.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao carregar tasks");
      setItems(data.items || []);
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message || "Falha ao carregar tasks" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const deleteTask = async (id: string) => {
    if (!window.confirm("Excluir esta task? Essa ação remove também as execuções relacionadas.")) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao excluir task");
      setMessage({ type: "success", text: "Task excluída com sucesso." });
      await load();
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message || "Falha ao excluir task" });
    }
  };

  const runTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}/run`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao criar execução");
      setMessage({ type: "success", text: `Execução criada: ${data.id}` });
      await load();
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message || "Falha ao criar execução" });
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>Tasks</Typography>
          <Typography sx={{ opacity: 0.8, mt: 1 }}>
            Cadastro central das automações. Tudo novo no sistema deve nascer por aqui.
          </Typography>
        </Box>
        <Button component={Link} href="/admin/tasks/new" variant="contained">Nova Task</Button>
      </Box>

      {message ? <Alert severity={message.type}>{message.text}</Alert> : null}

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 2 }}>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
            <TextField fullWidth label="Busca" value={q} onChange={(e) => setQ(e.target.value)} />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
            <TextField select fullWidth label="Tipo" value={type} onChange={(e) => setType(e.target.value)}>
              <MenuItem value="ALL">Todos</MenuItem>
              {["NEWS_VIDEO", "QA_VIDEO", "MERCADO_LIVRE_VIDEO", "SHOPEE_VIDEO"].map((item) => (
                <MenuItem key={item} value={item}>{item}</MenuItem>
              ))}
            </TextField>
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
            <TextField select fullWidth label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <MenuItem value="ALL">Todos</MenuItem>
              {["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"].map((item) => (
                <MenuItem key={item} value={item}>{item}</MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <Button variant="contained" onClick={load} disabled={loading}>Aplicar filtros</Button>
          <Button variant="outlined" onClick={() => { setQ(""); setType("ALL"); setStatus("ALL"); }}>Limpar</Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 0, overflow: "hidden" }}>
        <Box sx={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                {["Nome", "Tipo", "Status", "Último run", "Próxima execução", "Ações"].map((label) => (
                  <th key={label} style={{ textAlign: "left", padding: 16, fontSize: 12 }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <td style={{ padding: 16 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                      <Link href={`/admin/tasks/${item.id}`} style={{ fontWeight: 800 }}>
                        {item.name}
                      </Link>
                      <Typography sx={{ opacity: 0.65, fontSize: 12 }}>{item.slug}</Typography>
                    </Box>
                  </td>
                  <td style={{ padding: 16 }}>{item.type}</td>
                  <td style={{ padding: 16 }}>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Chip label={item.status} size="small" color={item.status === "ACTIVE" ? "success" : "default"} />
                      <Chip label={item.isEnabled ? "ON" : "OFF"} size="small" variant="outlined" />
                    </Box>
                  </td>
                  <td style={{ padding: 16 }}>
                    {item.runs?.[0]?.createdAt ? new Date(item.runs[0].createdAt).toLocaleString("pt-BR") : "—"}
                  </td>
                  <td style={{ padding: 16 }}>
                    {item.nextRunAt ? new Date(item.nextRunAt).toLocaleString("pt-BR") : "—"}
                  </td>
                  <td style={{ padding: 16 }}>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Button size="small" variant="outlined" component={Link} href={`/admin/tasks/${item.id}`}>Editar</Button>
                      <Button size="small" variant="outlined" onClick={() => runTask(item.id)}>Executar</Button>
                      <Button size="small" color="error" onClick={() => deleteTask(item.id)}>Excluir</Button>
                    </Box>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 24, textAlign: "center", opacity: 0.7 }}>
                    Nenhuma task encontrada.
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

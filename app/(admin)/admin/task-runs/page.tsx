"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Chip, Paper, Typography } from "@mui/material";
import { Button } from "@mui/material";

type TaskRunItem = {
  id: string;
  triggerType: string;
  status: string;
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  errorMessage?: string | null;
  task: {
    id: string;
    name: string;
    slug: string;
    type: string;
    status: string;
  };
  steps: Array<{
    id: string;
    stepKey: string;
    stepOrder: number;
    status: string;
  }>;
};

export default function TaskRunsPage() {
  const [items, setItems] = useState<TaskRunItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMessage(null);
      try {
        const res = await fetch("/api/task-runs?limit=50", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Falha ao carregar execuções");
        setItems(data.items || []);
      } catch (error: any) {
        setMessage(error?.message || "Falha ao carregar execuções");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const processOne = async () => {
    setProcessing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/task-runs/process", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await res.json();
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Falha ao processar execução");
      await new Promise((r) => setTimeout(r, 250));
      // reload
      const reload = await fetch("/api/task-runs?limit=50", { cache: "no-store" });
      const reloadData = await reload.json();
      if (reload.ok) setItems(reloadData.items || []);
    } catch (error: any) {
      setMessage(error?.message || "Falha ao processar execução");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>Execuções</Typography>
          <Typography sx={{ opacity: 0.8, mt: 1 }}>
            Visão central das operações disparadas pelas tasks.
          </Typography>
        </Box>
        <Button variant="contained" onClick={processOne} disabled={processing}>
          {processing ? "Processando..." : "Processar 1 pendente"}
        </Button>
      </Box>

      {message ? <Alert severity="error">{message}</Alert> : null}

      <Paper sx={{ p: 0, overflow: "hidden" }}>
        <Box sx={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                {["Task", "Status", "Trigger", "Criada em", "Etapas", "Erro"].map((label) => (
                  <th key={label} style={{ textAlign: "left", padding: 16, fontSize: 12 }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <td style={{ padding: 16 }}>
                    <Typography sx={{ fontWeight: 800 }}>{item.task.name}</Typography>
                    <Typography sx={{ opacity: 0.65, fontSize: 12 }}>{item.task.type}</Typography>
                  </td>
                  <td style={{ padding: 16 }}>
                    <Chip label={item.status} size="small" color={item.status === "COMPLETED" ? "success" : item.status === "FAILED" ? "error" : "default"} />
                  </td>
                  <td style={{ padding: 16 }}>{item.triggerType}</td>
                  <td style={{ padding: 16 }}>{new Date(item.createdAt).toLocaleString("pt-BR")}</td>
                  <td style={{ padding: 16 }}>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {item.steps.map((step) => (
                        <Chip key={step.id} label={`${step.stepOrder}. ${step.stepKey}`} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </td>
                  <td style={{ padding: 16 }}>{item.errorMessage || "—"}</td>
                </tr>
              ))}
              {!loading && items.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 24, textAlign: "center", opacity: 0.7 }}>
                    Nenhuma execução encontrada.
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

"use client";

import React, { useState } from "react";
import TimelineStepper, { PipelineStep } from "@/components/TimelineStepper";
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AssessmentIcon from "@mui/icons-material/Assessment";

export default function PipelineScrapersView({ initialData }: { initialData: any[] }) {
  const [url, setUrl] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Mocked steps for demonstration of the Pipeline UI
  const [steps, setSteps] = useState<PipelineStep[]>([
    { id: "1", name: "Coleta de Mídias", status: "PENDING" },
    { id: "2", name: "Escrita do Roteiro", status: "PENDING" },
    { id: "3", name: "Geração de Áudio", status: "PENDING" },
    { id: "4", name: "Renderização de Vídeo", status: "PENDING" },
  ]);

  const handleStartPipeline = async () => {
    if (!url) return;
    setIsModalOpen(true);
    setCurrentId("new-run");
    
    // Simulate pipeline progression
    setSteps(prev => prev.map(s => s.id === "1" ? { ...s, status: "RUNNING", logs: ["Iniciando scraper ML/Shopee...", "Baixando imagens..."] } : s));
    
    setTimeout(() => {
      setSteps(prev => prev.map(s => s.id === "1" ? { ...s, status: "SUCCESS" } : (s.id === "2" ? { ...s, status: "RUNNING", logs: ["Analisando características...", "Criando copy vendedora..."] } : s)));
    }, 2000);
    
    setTimeout(() => {
      setSteps(prev => prev.map(s => s.id === "2" ? { ...s, status: "SUCCESS" } : (s.id === "3" ? { ...s, status: "RUNNING", logs: ["Sintetizando voz com Edge TTS..."] } : s)));
    }, 4000);
    
    setTimeout(() => {
      setSteps(prev => prev.map(s => s.id === "3" ? { ...s, status: "SUCCESS" } : (s.id === "4" ? { ...s, status: "RUNNING", logs: ["Gerando Remotion bundle...", "Exportando MP4..."] } : s)));
    }, 6000);

    setTimeout(() => {
      setSteps(prev => prev.map(s => s.id === "4" ? { ...s, status: "SUCCESS" } : s));
    }, 8000);
  };

  return (
    <div className="space-y-6">
      {/* Header Form */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Nova Coleta (ML / Shopee)</h2>
        <div className="flex gap-4 items-center">
          <TextField
            fullWidth
            size="small"
            placeholder="Cole o link do produto aqui..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrowIcon />}
            onClick={handleStartPipeline}
            disabled={!url}
            className="whitespace-nowrap bg-indigo-600 hover:bg-indigo-700"
          >
            Iniciar Pipeline
          </Button>
        </div>
      </div>

      {/* List of Previous Runs (Mocked or DB Data) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Histórico de Pipelines</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="px-6 py-3 rounded-tl-lg">URL / Produto</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3 rounded-tr-lg">Ações</th>
              </tr>
            </thead>
            <tbody>
              {initialData.slice(0, 5).map((item: any, i: number) => (
                <tr key={i} className="bg-white border-b hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900 truncate max-w-[200px]">
                    {item.url || item.name || "Produto Coletado"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
                      CONCLUÍDO
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <Button size="small" variant="outlined" startIcon={<AssessmentIcon />} onClick={() => setIsModalOpen(true)}>
                      Ver Progresso
                    </Button>
                  </td>
                </tr>
              ))}
              {initialData.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Nenhum pipeline executado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stepper Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="font-bold text-slate-800 border-b">
          Progresso da Pipeline
        </DialogTitle>
        <DialogContent className="pt-6">
          <TimelineStepper steps={steps} />
        </DialogContent>
        <DialogActions className="p-4 border-t">
          <Button onClick={() => setIsModalOpen(false)} color="inherit">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import TimelineStepper, { PipelineStep } from "@/components/TimelineStepper";
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AssessmentIcon from "@mui/icons-material/Assessment";

export default function PipelineQuestionsView({ initialData }: { initialData: any[] }) {
  const [question, setQuestion] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [steps, setSteps] = useState<PipelineStep[]>([
    { id: "1", name: "Análise da Pergunta", status: "PENDING" },
    { id: "2", name: "Pesquisa de Resposta", status: "PENDING" },
    { id: "3", name: "Geração de Locução", status: "PENDING" },
    { id: "4", name: "Criação do Vídeo Animado", status: "PENDING" },
  ]);

  const handleStartPipeline = async () => {
    if (!question) return;
    setIsModalOpen(true);
    
    setSteps(prev => prev.map(s => s.id === "1" ? { ...s, status: "RUNNING", logs: ["Analisando intenção da pergunta..."] } : s));
    
    setTimeout(() => {
      setSteps(prev => prev.map(s => s.id === "1" ? { ...s, status: "SUCCESS" } : (s.id === "2" ? { ...s, status: "RUNNING", logs: ["Buscando contexto e respostas...", "Redigindo roteiro didático."] } : s)));
    }, 2000);
    
    setTimeout(() => {
      setSteps(prev => prev.map(s => s.id === "2" ? { ...s, status: "SUCCESS" } : (s.id === "3" ? { ...s, status: "RUNNING", logs: ["Sintetizando explicação em áudio..."] } : s)));
    }, 4000);
    
    setTimeout(() => {
      setSteps(prev => prev.map(s => s.id === "3" ? { ...s, status: "SUCCESS" } : (s.id === "4" ? { ...s, status: "RUNNING", logs: ["Renderizando composição gráfica..."] } : s)));
    }, 6000);

    setTimeout(() => {
      setSteps(prev => prev.map(s => s.id === "4" ? { ...s, status: "SUCCESS" } : s));
    }, 8000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Nova Pipeline de Perguntas & Respostas</h2>
        <div className="flex gap-4 items-center">
          <TextField
            fullWidth
            size="small"
            placeholder="Qual pergunta deseja responder em vídeo?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrowIcon />}
            onClick={handleStartPipeline}
            disabled={!question}
            className="whitespace-nowrap bg-purple-600 hover:bg-purple-700"
          >
            Iniciar Pipeline
          </Button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Histórico de Q&A</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="px-6 py-3 rounded-tl-lg">Pergunta</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3 rounded-tr-lg">Ações</th>
              </tr>
            </thead>
            <tbody>
              {initialData.slice(0, 5).map((item: any, i: number) => (
                <tr key={i} className="bg-white border-b hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900 truncate max-w-[200px]">
                    {item.question || item.prompt || "Pergunta gerada"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">CONCLUÍDO</span>
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
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Nenhum pipeline executado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="font-bold text-slate-800 border-b">Progresso da Pipeline</DialogTitle>
        <DialogContent className="pt-6"><TimelineStepper steps={steps} /></DialogContent>
        <DialogActions className="p-4 border-t">
          <Button onClick={() => setIsModalOpen(false)} color="inherit">Fechar</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

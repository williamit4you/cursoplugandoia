"use client";

import { useEffect, useState } from "react";

const SECRET = process.env.NEXT_PUBLIC_WORKER_SECRET || "super-secret-worker-key-123";

type Config = {
  id: string;
  isEnabled: boolean;
  intervalMinutes: number;
  scheduledTimes: string; // JSON
  useScheduledTimes: boolean;
  maxQuestionsPerRun: number;
  defaultAspectRatio: "PORTRAIT_9_16" | "LANDSCAPE_16_9";
  videoDurationSec: number;
  fps: number;
  ttsVoice: string;
  ttsSpeed: string;
  autoEnqueueMeta: boolean;
  autoEnqueueTikTok: boolean;
  autoEnqueueLinkedIn: boolean;
  autoEnqueueYouTube: boolean;
  useExternalMedia: boolean;
};

const DEFAULT: Config = {
  id: "",
  isEnabled: true,
  intervalMinutes: 60,
  scheduledTimes: "[]",
  useScheduledTimes: false,
  maxQuestionsPerRun: 3,
  defaultAspectRatio: "PORTRAIT_9_16",
  videoDurationSec: 30,
  fps: 30,
  ttsVoice: "pt-BR-AntonioNeural",
  ttsSpeed: "+5%",
  autoEnqueueMeta: false,
  autoEnqueueTikTok: false,
  autoEnqueueLinkedIn: false,
  autoEnqueueYouTube: false,
  useExternalMedia: false,
};

export default function VideoQuestionsConfigPage() {
  const [config, setConfig] = useState<Config>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const hdrs = { "x-worker-secret": SECRET, "Content-Type": "application/json" };

  const fetchCfg = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/video-questions/config", { headers: hdrs });
      if (res.ok) setConfig(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCfg();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/video-questions/config", {
        method: "POST",
        headers: hdrs,
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Erro ao salvar");
        return;
      }
      setConfig(data);
      setSaved("Configuração salva com sucesso!");
      setTimeout(() => setSaved(null), 2500);
    } catch {
      alert("Erro de conexão");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Configuração • Perguntas → vídeos</h1>
      <p className="text-sm text-gray-600 mb-6">
        Controle o agendamento e os defaults (formato, duração e voz) para o daemon do worker processar as perguntas.
      </p>

      <div className="rounded-lg border bg-white p-5 space-y-4">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={config.isEnabled} onChange={(e) => setConfig((c) => ({ ...c, isEnabled: e.target.checked }))} />
          Ativo
        </label>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1">Intervalo (minutos)</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              type="number"
              min={1}
              value={config.intervalMinutes}
              onChange={(e) => setConfig((c) => ({ ...c, intervalMinutes: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Máx. por execução</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              type="number"
              min={1}
              value={config.maxQuestionsPerRun}
              onChange={(e) => setConfig((c) => ({ ...c, maxQuestionsPerRun: Number(e.target.value) }))}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={config.useScheduledTimes}
            onChange={(e) => setConfig((c) => ({ ...c, useScheduledTimes: e.target.checked }))}
          />
          Usar horários fixos (scheduledTimes)
        </label>

        <div>
          <label className="block text-sm font-semibold mb-1">Horários (JSON)</label>
          <input
            className="w-full rounded-md border px-3 py-2 font-mono text-xs"
            value={config.scheduledTimes}
            onChange={(e) => setConfig((c) => ({ ...c, scheduledTimes: e.target.value }))}
            placeholder='["08:00","14:00"]'
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1">Formato padrão</label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={config.defaultAspectRatio}
              onChange={(e) => setConfig((c) => ({ ...c, defaultAspectRatio: e.target.value as any }))}
            >
              <option value="PORTRAIT_9_16">TikTok/Reels (9:16)</option>
              <option value="LANDSCAPE_16_9">YouTube (16:9)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Duração (s)</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              type="number"
              min={5}
              max={600}
              value={config.videoDurationSec}
              onChange={(e) => setConfig((c) => ({ ...c, videoDurationSec: Number(e.target.value) }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1">Voz (TTS)</label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={config.ttsVoice}
              onChange={(e) => setConfig((c) => ({ ...c, ttsVoice: e.target.value }))}
            >
              <option value="pt-BR-AntonioNeural">Antônio (pt-BR, masculino)</option>
              <option value="pt-BR-FranciscaNeural">Francisca (pt-BR, feminino)</option>
              <option value="pt-PT-DuarteNeural">Duarte (pt-PT, masculino)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Velocidade</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={config.ttsSpeed}
              onChange={(e) => setConfig((c) => ({ ...c, ttsSpeed: e.target.value }))}
              placeholder="+5%"
            />
          </div>
        </div>

        <div className="rounded-md border p-4">
          <div className="text-sm font-bold mb-2">Auto-enfileirar após concluir</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={config.autoEnqueueMeta} onChange={(e) => setConfig((c) => ({ ...c, autoEnqueueMeta: e.target.checked }))} />
              Meta (Reels)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={config.autoEnqueueTikTok} onChange={(e) => setConfig((c) => ({ ...c, autoEnqueueTikTok: e.target.checked }))} />
              TikTok
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={config.autoEnqueueLinkedIn} onChange={(e) => setConfig((c) => ({ ...c, autoEnqueueLinkedIn: e.target.checked }))} />
              LinkedIn
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={config.autoEnqueueYouTube} onChange={(e) => setConfig((c) => ({ ...c, autoEnqueueYouTube: e.target.checked }))} />
              YouTube (em breve)
            </label>
          </div>
        </div>

        <div className="rounded-md border p-4 bg-indigo-50 border-indigo-100">
          <label className="flex items-center gap-2 text-sm font-bold text-indigo-900 cursor-pointer">
            <input
              type="checkbox"
              checked={config.useExternalMedia}
              onChange={(e) => setConfig((c) => ({ ...c, useExternalMedia: e.target.checked }))}
            />
            Usar banco de mídias externas (Pexels)
          </label>
          <p className="text-xs text-indigo-700 mt-1 ml-5">
            Se ativo, a IA buscará vídeos e imagens no Pexels para ilustrar o fundo do vídeo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving} className="rounded-md bg-indigo-600 px-4 py-2 text-white font-semibold disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar"}
          </button>
          {saved ? <span className="text-sm text-emerald-700 font-semibold">{saved}</span> : null}
        </div>
      </div>
    </div>
  );
}


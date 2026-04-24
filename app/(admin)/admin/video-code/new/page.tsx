"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AspectRatio = "PORTRAIT_9_16" | "LANDSCAPE_16_9";

const TTS_VOICES = [
  { id: "pt-BR-AntonioNeural", label: "Antônio (pt-BR, masculino)" },
  { id: "pt-BR-FranciscaNeural", label: "Francisca (pt-BR, feminino)" },
  { id: "pt-PT-DuarteNeural", label: "Duarte (pt-PT, masculino)" },
];

export default function NewVideoCodeProjectPage() {
  const router = useRouter();
  const [ideaPrompt, setIdeaPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("PORTRAIT_9_16");
  const [videoDurationSec, setVideoDurationSec] = useState(30);
  const [ttsVoice, setTtsVoice] = useState("pt-BR-AntonioNeural");
  const [ttsSpeed, setTtsSpeed] = useState("+5%");
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [loading, setLoading] = useState(false);

  const createProject = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/video-code/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaPrompt, aspectRatio, videoDurationSec, ttsVoice, ttsSpeed }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Erro ao criar projeto");
        setLoading(false);
        return;
      }
      if (autoGenerate) {
        const genRes = await fetch("/api/video-code/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: data.id }),
        });
        const genData = await genRes.json();
        if (!genRes.ok) {
          alert(genData?.error || "Erro ao gerar com IA");
        }
      }

      router.push(`/admin/video-code/${data.id}`);
    } catch {
      alert("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Novo vídeo com código</h1>
      <p className="text-sm text-gray-600 mb-6">
        Escreva a ideia. Depois você vai poder editar título, descrição, narração e as cenas (templates).
      </p>

      <div className="rounded-lg border bg-white p-5 space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Formato</label>
          <select
            className="w-full rounded-md border px-3 py-2"
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
          >
            <option value="PORTRAIT_9_16">TikTok/Reels (9:16 — 1080x1920)</option>
            <option value="LANDSCAPE_16_9">YouTube (16:9 — 1920x1080)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Duração (segundos)</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="number"
            min={5}
            max={300}
            value={videoDurationSec}
            onChange={(e) => setVideoDurationSec(Number(e.target.value))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1">Voz (narração)</label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={ttsVoice}
              onChange={(e) => setTtsVoice(e.target.value)}
            >
              {TTS_VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Velocidade</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={ttsSpeed}
              onChange={(e) => setTtsSpeed(e.target.value)}
              placeholder="+5%"
            />
            <div className="mt-1 text-xs text-gray-500">Formato: +5% / -10%</div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Ideia / comando</label>
          <textarea
            className="w-full rounded-md border px-3 py-2 min-h-[140px]"
            placeholder='Ex.: "Faça um vídeo sobre React Server Components"'
            value={ideaPrompt}
            onChange={(e) => setIdeaPrompt(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoGenerate}
            onChange={(e) => setAutoGenerate(e.target.checked)}
          />
          Gerar automaticamente com IA após criar
        </label>

        <div className="flex items-center gap-3">
          <button
            onClick={createProject}
            disabled={loading || ideaPrompt.trim().length === 0}
            className="rounded-md bg-indigo-600 px-4 py-2 text-white font-semibold disabled:opacity-50"
          >
            {loading ? (autoGenerate ? "Criando e gerando..." : "Criando...") : "Criar projeto"}
          </button>
          <button
            onClick={() => router.push("/admin/video-code")}
            className="rounded-md border px-4 py-2 font-semibold"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

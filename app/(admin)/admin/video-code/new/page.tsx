"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AspectRatio = "PORTRAIT_9_16" | "LANDSCAPE_16_9";

const TTS_VOICES = [
  { id: "pt-BR-AntonioNeural", label: "Antônio (pt-BR, Masculino)", description: "Voz enérgica e clara, ideal para vídeos virais." },
  { id: "pt-BR-FranciscaNeural", label: "Francisca (pt-BR, Feminino)", description: "Voz suave e profissional para tutoriais." },
  { id: "pt-PT-DuarteNeural", label: "Duarte (pt-PT, Masculino)", description: "Voz clássica com sotaque de Portugal." },
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
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="mb-10">
        <button 
          onClick={() => router.push("/admin/video-code")} 
          className="group flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-indigo-600 transition-colors mb-4"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Voltar para lista
        </button>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Novo Projeto de Vídeo</h1>
        <p className="text-gray-500 mt-2 text-lg">Defina a ideia central e deixe a nossa IA estruturar o roteiro e as cenas para você.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-indigo-50/50 p-8 space-y-8">
            
            {/* Idea Section */}
            <div className="space-y-4">
              <label className="text-sm font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                 <div className="w-6 h-6 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-[10px]">1</div>
                 Ideia Principal / Comando
              </label>
              <textarea
                className="w-full rounded-2xl border-gray-100 bg-gray-50 px-6 py-5 min-h-[160px] text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 transition-all text-lg leading-relaxed shadow-inner"
                placeholder='Ex.: "Crie um vídeo rápido explicando por que o café ajuda na produtividade, com tom enérgico."'
                value={ideaPrompt}
                onChange={(e) => setIdeaPrompt(e.target.value)}
              />
              <p className="text-xs text-gray-400 font-medium italic">* Quanto mais detalhes você der, melhor será o roteiro gerado pela IA.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Formato Section */}
              <div className="space-y-4">
                <label className="text-sm font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                   <div className="w-6 h-6 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-[10px]">2</div>
                   Formato
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { id: "PORTRAIT_9_16", label: "Vertical (9:16)", sub: "TikTok, Reels, Shorts", icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
                    { id: "LANDSCAPE_16_9", label: "Horizontal (16:9)", sub: "YouTube, Desktop", icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setAspectRatio(opt.id as AspectRatio)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                        aspectRatio === opt.id 
                          ? 'border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-50' 
                          : 'border-gray-100 hover:border-gray-200 bg-white'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${aspectRatio === opt.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={opt.icon}></path></svg>
                      </div>
                      <div>
                        <div className={`font-black text-sm ${aspectRatio === opt.id ? 'text-indigo-900' : 'text-gray-700'}`}>{opt.label}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase">{opt.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Voz Section */}
              <div className="space-y-4">
                <label className="text-sm font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                   <div className="w-6 h-6 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-[10px]">3</div>
                   Voz da Narração
                </label>
                <select
                  className="w-full rounded-2xl border-gray-100 bg-gray-50 px-5 py-4 font-bold text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                  value={ttsVoice}
                  onChange={(e) => setTtsVoice(e.target.value)}
                >
                  {TTS_VOICES.map((v) => (
                    <option key={v.id} value={v.id}>{v.label}</option>
                  ))}
                </select>
                <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-700 text-xs font-medium leading-relaxed">
                  {TTS_VOICES.find(v => v.id === ttsVoice)?.description}
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
               <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={autoGenerate}
                    onChange={(e) => setAutoGenerate(e.target.checked)}
                  />
                  <div className={`block w-12 h-7 rounded-full transition-colors ${autoGenerate ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${autoGenerate ? 'translate-x-5' : ''}`}></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-gray-900">Geração Inteligente</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Criar roteiro com IA imediatamente</span>
                </div>
              </label>

              <div className="flex gap-3 w-full md:w-auto">
                <button
                  onClick={() => router.push("/admin/video-code")}
                  className="flex-1 md:flex-none rounded-2xl border border-gray-200 px-8 py-4 font-bold text-gray-500 hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={createProject}
                  disabled={loading || ideaPrompt.trim().length === 0}
                  className="flex-1 md:flex-none flex items-center justify-center gap-3 rounded-2xl bg-indigo-600 px-10 py-4 text-white font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all hover:-translate-y-1 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      <span>Criar Projeto</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Column */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 opacity-10">
                 <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <h4 className="text-xl font-black mb-4 relative z-10 tracking-tight">Como funciona?</h4>
              <ul className="space-y-4 relative z-10">
                {[
                  { t: 'Idea to Script', d: 'Nossa IA transforma sua ideia em um roteiro completo em segundos.' },
                  { t: 'Smart Templates', d: 'Cenas automáticas são selecionadas para combinar com a narração.' },
                  { t: 'Manual Control', d: 'Você pode editar cada palavra e cena antes de renderizar o MP4.' }
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-3">
                    <div className="w-5 h-5 bg-white/20 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black">{idx+1}</div>
                    <div>
                      <div className="font-black text-sm">{item.t}</div>
                      <div className="text-[10px] text-indigo-100 font-medium leading-tight">{item.d}</div>
                    </div>
                  </li>
                ))}
              </ul>
           </div>

           <div className="rounded-3xl border border-gray-100 bg-white p-6 space-y-4">
              <div className="flex items-center gap-3 text-emerald-600 mb-2">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                 <span className="font-black text-sm uppercase tracking-widest">Segurança & IA</span>
              </div>
              <p className="text-gray-500 text-xs leading-relaxed font-medium">
                Utilizamos os modelos mais recentes da OpenAI para garantir roteiros persuasivos e naturais. Seus dados são processados de forma segura e privada.
              </p>
           </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

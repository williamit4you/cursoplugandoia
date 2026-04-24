"use client";

import { useEffect, useState, useMemo } from "react";

const SECRET = process.env.NEXT_PUBLIC_WORKER_SECRET || "super-secret-worker-key-123";

type Config = {
  id: string;
  isEnabled: boolean;
  intervalMinutes: number;
  scheduledTimes: string; // JSON string like ["08:00", "14:00"]
  useScheduledTimes: boolean;
  maxQuestionsPerRun: number;
  defaultAspectRatio: "PORTRAIT_9_16" | "LANDSCAPE_16_9";
  videoDurationSec: number;
  fps: number;
  ttsVoice: string;
  ttsSpeed: string; // Like "+5%" or "-10%"
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
  ttsSpeed: "+0%",
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
  
  // Helpers for UI
  const [newTime, setNewTime] = useState("");

  const hdrs = { "x-worker-secret": SECRET, "Content-Type": "application/json" };

  const fetchCfg = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/video-questions/config", { headers: hdrs });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
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
      setTimeout(() => setSaved(null), 3000);
    } catch {
      alert("Erro de conexão");
    } finally {
      setSaving(false);
    }
  };

  // Scheduled Times logic
  const timesList = useMemo(() => {
    try {
      return JSON.parse(config.scheduledTimes) as string[];
    } catch {
      return [];
    }
  }, [config.scheduledTimes]);

  const addTime = () => {
    if (!newTime) return;
    if (timesList.includes(newTime)) return;
    const newList = [...timesList, newTime].sort();
    setConfig(prev => ({ ...prev, scheduledTimes: JSON.stringify(newList) }));
    setNewTime("");
  };

  const removeTime = (t: string) => {
    const newList = timesList.filter(item => item !== t);
    setConfig(prev => ({ ...prev, scheduledTimes: JSON.stringify(newList) }));
  };

  // TTS Speed logic (String "+5%" -> Number 5)
  const speedValue = useMemo(() => {
    const val = parseInt(config.ttsSpeed.replace("%", ""));
    return isNaN(val) ? 0 : val;
  }, [config.ttsSpeed]);

  const handleSpeedChange = (val: number) => {
    const prefix = val >= 0 ? "+" : "";
    setConfig(prev => ({ ...prev, ttsSpeed: `${prefix}${val}%` }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl pb-20 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Configuração do Sistema</h1>
          <p className="text-gray-500 mt-1">Gerencie como a IA cria e agenda seus vídeos de perguntas.</p>
        </div>
        <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${config.isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
          <div className={`w-2 h-2 rounded-full ${config.isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></div>
          {config.isEnabled ? 'Sistema Ativo' : 'Sistema Pausado'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Scheduling Section */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Agendamento
              </h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={config.isEnabled} onChange={(e) => setConfig(c => ({...c, isEnabled: e.target.checked}))} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:width-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Intervalo entre execuções</label>
                  <div className="relative">
                    <input
                      type="number"
                      className="block w-full rounded-xl border-gray-200 bg-gray-50 pl-4 pr-12 py-3 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 transition-all font-semibold"
                      value={config.intervalMinutes}
                      onChange={(e) => setConfig(c => ({...c, intervalMinutes: Number(e.target.value)}))}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400 text-sm font-medium">min</div>
                  </div>
                  <p className="text-xs text-gray-400">Tempo de espera se não usar horários fixos.</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Lote máximo (Batch size)</label>
                  <input
                    type="number"
                    className="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 transition-all font-semibold"
                    value={config.maxQuestionsPerRun}
                    onChange={(e) => setConfig(c => ({...c, maxQuestionsPerRun: Number(e.target.value)}))}
                  />
                  <p className="text-xs text-gray-400">Quantas perguntas processar por vez.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-50">
                <div className="flex items-center gap-3 mb-4">
                  <input 
                    type="checkbox" 
                    id="useScheduled"
                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                    checked={config.useScheduledTimes} 
                    onChange={(e) => setConfig(c => ({...c, useScheduledTimes: e.target.checked}))} 
                  />
                  <label htmlFor="useScheduled" className="text-sm font-bold text-gray-800 cursor-pointer">Usar horários fixos no dia</label>
                </div>

                {config.useScheduledTimes && (
                  <div className="bg-indigo-50/50 rounded-2xl p-5 space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex flex-wrap gap-2">
                      {timesList.length === 0 && <span className="text-sm text-indigo-400 italic">Nenhum horário definido...</span>}
                      {timesList.map(t => (
                        <div key={t} className="bg-white border border-indigo-100 pl-3 pr-1 py-1 rounded-lg flex items-center gap-2 shadow-sm text-indigo-700 font-bold text-sm">
                          {t}
                          <button onClick={() => removeTime(t)} className="p-1 hover:bg-red-50 hover:text-red-500 rounded transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <input 
                        type="time" 
                        className="rounded-xl border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 transition-all font-bold"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                      />
                      <button 
                        onClick={addTime}
                        disabled={!newTime}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        Adicionar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Media & AI Section */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                Estética e Voz (IA)
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Formato de tela</label>
                  <select
                    className="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 transition-all font-semibold appearance-none"
                    value={config.defaultAspectRatio}
                    onChange={(e) => setConfig(c => ({...c, defaultAspectRatio: e.target.value as any}))}
                  >
                    <option value="PORTRAIT_9_16">Vertical (TikTok/Reels) • 9:16</option>
                    <option value="LANDSCAPE_16_9">Horizontal (YouTube) • 16:9</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Duração do vídeo</label>
                  <div className="relative">
                    <input
                      type="number"
                      className="block w-full rounded-xl border-gray-200 bg-gray-50 pl-4 pr-12 py-3 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 transition-all font-semibold"
                      value={config.videoDurationSec}
                      onChange={(e) => setConfig(c => ({...c, videoDurationSec: Number(e.target.value)}))}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400 text-sm font-medium">seg</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Narração (Voz)</label>
                  <select
                    className="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 transition-all font-semibold appearance-none"
                    value={config.ttsVoice}
                    onChange={(e) => setConfig(c => ({...c, ttsVoice: e.target.value}))}
                  >
                    <option value="pt-BR-AntonioNeural">Antônio (Brasileiro, Maduro)</option>
                    <option value="pt-BR-FranciscaNeural">Francisca (Brasileira, Suave)</option>
                    <option value="pt-BR-DonatoNeural">Donato (Brasileiro, Firme)</option>
                    <option value="pt-PT-DuarteNeural">Duarte (Português, Clássico)</option>
                  </select>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-700">Velocidade da voz</label>
                    <span className={`text-xs font-black px-2 py-1 rounded ${speedValue >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                      {config.ttsSpeed}
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="-50" 
                    max="50" 
                    step="5"
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    value={speedValue}
                    onChange={(e) => handleSpeedChange(Number(e.target.value))}
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase">
                    <span>Lento</span>
                    <span>Normal</span>
                    <span>Rápido</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-start gap-4 transition-all hover:shadow-md">
                <div className="mt-1 bg-white p-2 rounded-lg shadow-sm">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="useExternal" className="text-sm font-bold text-indigo-900 cursor-pointer">Usar Banco Pexels</label>
                    <input 
                      type="checkbox" 
                      id="useExternal"
                      className="w-5 h-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500" 
                      checked={config.useExternalMedia} 
                      onChange={(e) => setConfig(c => ({...c, useExternalMedia: e.target.checked}))} 
                    />
                  </div>
                  <p className="text-xs text-indigo-600/70 mt-1">Busca automática de vídeos de fundo para ilustrar o conteúdo.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Publishing Section */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.167a2.405 2.405 0 00-1.212-1.296L1.51 10.32a1.76 1.76 0 01.107-3.326l6.233-1.637a1.76 1.76 0 011.76.625z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 6h4l2 2m-6 4h6m-6 4h4"></path></svg>
                Auto-Publicação
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-500 leading-relaxed mb-2">Enviar automaticamente para a fila de publicação assim que o vídeo estiver pronto.</p>
              
              {[
                { key: 'autoEnqueueMeta', label: 'Instagram / Meta', icon: 'M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z' },
                { key: 'autoEnqueueTikTok', label: 'TikTok', icon: 'M11.666 3.333v10.667a2.667 2.667 0 11-2.666-2.667c.366 0 .708.075 1.018.209V8.209A5.333 5.333 0 1014.333 11c0-.05-.002-.1-.005-.15V3.333h-2.662z' },
                { key: 'autoEnqueueLinkedIn', label: 'LinkedIn', icon: 'M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a2.7 2.7 0 0 0-2.7-2.7c-1.2 0-2 .7-2.4 1.3v-1.1h-2.5v7.8h2.5v-4.2c0-.6.5-1.1 1.1-1.1s1.1.5 1.1 1.1v4.2h2.9M8.1 18.5v-7.8h-2.6v7.8H8.1M7.9 9.5c.9 0 1.4-.5 1.4-1.3c0-.7-.5-1.2-1.3-1.2c-.8 0-1.4.5-1.4 1.2c0 .8.6 1.3 1.3 1.3z' },
                { key: 'autoEnqueueYouTube', label: 'YouTube Shorts', icon: 'M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15V9l5.2 3L10 15z' },
              ].map((item) => (
                <label key={item.key} className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${config[item.key as keyof Config] ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-100 hover:bg-white hover:border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-colors ${config[item.key as keyof Config] ? 'bg-indigo-600 text-white' : 'bg-white text-gray-400 group-hover:text-gray-600 shadow-sm'}`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d={item.icon}></path></svg>
                    </div>
                    <span className={`text-sm font-bold ${config[item.key as keyof Config] ? 'text-indigo-900' : 'text-gray-600'}`}>{item.label}</span>
                  </div>
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                    checked={config[item.key as keyof Config] as boolean} 
                    onChange={(e) => setConfig(c => ({...c, [item.key]: e.target.checked}))} 
                  />
                </label>
              ))}
            </div>
          </section>

          {/* Action Bar - Floating or fixed at bottom of sidebar */}
          <div className="sticky top-6">
            <button 
              onClick={save} 
              disabled={saving} 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3 group"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              )}
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
            {saved && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {saved}
              </div>
            )}
          </div>

        </div>
      </div>

      <style jsx global>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          background: #4f46e5;
          cursor: pointer;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: #4f46e5;
          cursor: pointer;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}

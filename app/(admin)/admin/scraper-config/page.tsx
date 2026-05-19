"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { 
  Settings, Coins, Clock, Sliders, Bot, FileText, Video, 
  Globe, History, Sparkles, Plus, X, ChevronDown, ChevronUp, Check, AlertCircle, RefreshCw
} from "lucide-react";

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

const SECRET = process.env.NEXT_PUBLIC_WORKER_SECRET || "super-secret-worker-key-123";

const AI_MODELS = [
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    inputPrice: 0.15,
    outputPrice: 0.60,
    desc: "Rápido e econômico — ideal para produção",
    stars: 4,
    badge: "Recomendado",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    inputPrice: 2.50,
    outputPrice: 10.00,
    desc: "Melhor qualidade de texto e reasoning",
    stars: 5,
    badge: "Melhor qualidade",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    inputPrice: 10.00,
    outputPrice: 30.00,
    desc: "Contexto de 128k tokens — textos longos",
    stars: 5,
    badge: "Contexto longo",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    id: "gpt-4",
    name: "GPT-4",
    inputPrice: 30.00,
    outputPrice: 60.00,
    desc: "Modelo legado, robusto e confiável",
    stars: 4,
    badge: "Legado",
    badgeColor: "bg-slate-50 text-slate-700 border-slate-200",
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    inputPrice: 0.50,
    outputPrice: 1.50,
    desc: "Mais barato — para testes e rascunhos",
    stars: 3,
    badge: "Econômico",
    badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
  },
];

const VIDEO_STYLES = [
  { id: "journalism", label: "📰 Jornalismo", desc: "Informativo, direto, objetivo" },
  { id: "story", label: "📖 História", desc: "Narrativo, envolvente, início/meio/fim" },
  { id: "ad", label: "📣 Propaganda", desc: "Persuasivo, focado em benefícios" },
  { id: "funny", label: "😂 Engraçado", desc: "Humor, descontraído, mas informativo" },
  { id: "ironic", label: "😏 Irônico", desc: "Sarcástico, crítico, embasado nos fatos" },
  { id: "polemico", label: "🔥 Polêmico", desc: "Provocador, emocional, foco no viral" },
  { id: "breaking", label: "⚡ Breaking News", desc: "Urgência máxima, sensação de ao vivo" },
  { id: "investigativo", label: "🔍 Investigativo", desc: "Revela detalhes, jornalismo profundo" },
];

const TTS_VOICES = [
  { id: "pt-BR-AntonioNeural", label: "🇧🇷 Antônio (masculino)" },
  { id: "pt-BR-FranciscaNeural", label: "🇧🇷 Francisca (feminino)" },
  { id: "pt-PT-DuarteNeural", label: "🇵🇹 Duarte (Portugal, masculino)" },
];

const VIDEO_DURATIONS = [
  { value: 30, label: "30 segundos" },
  { value: 60, label: "1 minuto" },
  { value: 90, label: "1 min 30s" },
  { value: 120, label: "2 minutos" },
  { value: 180, label: "3 minutos" },
  { value: 300, label: "5 minutos" },
];

const DEFAULT_PROMPT = `Você é um jornalista independente de tecnologia focado em alta conversão SEO.
Seu objetivo é ler um texto raw raspado da internet, e REESCREVÊ-LO por completo com suas palavras,
garantindo que NENHUM plágio seja detectado, mas mantendo 100% da precisão dos fatos noticiados.
Você deve outputar um JSON rigorosamente estruturado com:
- "title": Um título impactante (SEM clickbait exagerado, formato editorial)
- "summary": Um roteiro ENGAJADOR e direto para um vídeo TikTok/Reels/Story baseado na notícia, com tamanho proporcional a {duration_sec} segundos de locução. Mire em cerca de {summary_char_target} a {summary_char_max} caracteres.
- "content_html": O artigo escrito, formatado com tags HTML semânticas como <p>, <h2>, e <b>. Formato pronto pro TipTap Editor.
{style_instruction}`;

const PROMPT_PRESETS = [
  {
    id: "jornalistico",
    label: "📰 Jornalístico",
    emoji: "📰",
    desc: "Rigoroso, imparcial, editorial",
    color: "text-blue-700 border-blue-200 bg-blue-50/55",
    prompt: `Você é um jornalista sênior de tecnologia, imparcial e rigoroso.
Leia o texto bruto e reescreva-o completamente com linguagem jornalística formal.
Sua missão é informar com precisão, sem opinião pessoal ou sensacionalismo.
JSON obrigatório:
- "title": Título no estilo manchete editorial (objetivo, sem exagero)
- "summary": Roteiro neutro e informativo de até {duration_sec}s de locução (máx 450 chars)
- "content_html": Artigo em HTML com <p>, <h2>, <b>. Estrutura: lead → desenvolvimento → contexto.
{style_instruction}`,
  },
  {
    id: "viral",
    label: "🔥 Viral / Polêmico",
    emoji: "🔥",
    desc: "Provocador, emocional, máxima retenção",
    color: "text-rose-700 border-rose-200 bg-rose-50/55",
    prompt: `Você é um criador de conteúdo especialista em VIRALIZAÇÃO para redes sociais.
Sua missão é transformar o texto bruto em conteúdo EXPLOSIVO que gera compartilhamentos, reações e comentários.
Use linguagem provocadora, gatilhos emocionais (curiosidade, indignação, surpresa) e ganchos irresistíveis.
JSON obrigatório:
- "title": Título CHOCANTE que para o scroll (use números, perguntas ou afirmações polêmicas)
- "summary": Roteiro com GANCHO poderoso nos primeiros 3 segundos, revelação gradual, CTA final. Até {duration_sec}s (máx 450 chars)
- "content_html": Artigo em HTML com <p>, <h2>, <b>. Tom: provocador mas embasado nos fatos.
{style_instruction}`,
  },
  {
    id: "cientifico",
    label: "🔬 Científico",
    emoji: "🔬",
    desc: "Educativo, aprofundado, baseado em dados",
    color: "text-cyan-700 border-cyan-200 bg-cyan-50/55",
    prompt: `Você é um divulgador científico especializado em tecnologia e inovação.
Explique o tema com precisão técnica, mas de forma compreensível para leigos inteligentes.
Cite dados, contextualize descobertas e explique o impacto no mundo real.
JSON obrigatório:
- "title": Título que desperta curiosidade intelectual (ex: "Como X funciona e por que muda tudo")
- "summary": Explicação clara e fascinante de até {duration_sec}s, como um documentário. Máx 450 chars.
- "content_html": Artigo em HTML com <p>, <h2>, <b>. Inclua: o que é → como funciona → impacto → futuro.
{style_instruction}`,
  },
  {
    id: "storytelling",
    label: "📖 Storytelling",
    emoji: "📖",
    desc: "Narrativo, humano, emocional",
    color: "text-violet-700 border-violet-200 bg-violet-50/55",
    prompt: `Você é um mestre do storytelling digital.
Transforme a notícia em uma história com personagens, conflito e resolução.
Conecte os fatos com a emoção humana por trás deles.
JSON obrigatório:
- "title": Título que conta o começo de uma história (ex: "A noite em que X mudou tudo para Y")
- "summary": Roteiro como uma mini-história de até {duration_sec}s — cena de abertura, conflito, desfecho. Máx 450 chars.
- "content_html": Artigo em HTML com <p>, <h2>, <b>. Narrativa em primeira ou terceira pessoa, vívida e humana.
{style_instruction}`,
  },
  {
    id: "breaking",
    label: "⚡ Breaking News",
    emoji: "⚡",
    desc: "Urgência máxima, sensação de ao vivo",
    color: "text-amber-700 border-amber-200 bg-amber-50/55",
    prompt: `Você é um âncora de telejornal ao vivo cobrindo uma notícia de última hora.
Transmita urgência e importância. O leitor deve sentir que precisa saber AGORA.
JSON obrigatório:
- "title": Título de URGÊNCIA (ex: "AGORA: X acontece e pode mudar Y")
- "summary": Boletim urgente de até {duration_sec}s, direto ao ponto, sem enrolação. Máx 450 chars.
- "content_html": Artigo em HTML com <p>, <h2>, <b>. Estrutura: fato principal → quem → quando → impacto imediato.
{style_instruction}`,
  },
  {
    id: "investigativo",
    label: "🔍 Investigativo",
    emoji: "🔍",
    desc: "Revela detalhes ocultos, profundo",
    color: "text-slate-700 border-slate-200 bg-slate-50/55",
    prompt: `Você é um jornalista investigativo que revela o que a mídia mainstream não conta.
Questione, aprofunde, mostre os bastidores e o impacto oculto da notícia.
JSON obrigatório:
- "title": Título que sugere revelação (ex: "O que ninguém está falando sobre X")
- "summary": Roteiro de até {duration_sec}s revelando camadas da história. Tom: suspense investigativo. Máx 450 chars.
- "content_html": Artigo em HTML com <p>, <h2>, <b>. Mostre: contexto oculto → quem se beneficia → o que pode acontecer.
{style_instruction}`,
  },
];

type ScraperConfig = {
  id?: string;
  intervalHours: number;
  scheduledTimes: string;
  useScheduledTimes: boolean;
  isEnabled: boolean;
  maxArticlesPerRun: number;
  aiModel: string;
  aiTemperature: number;
  systemPrompt: string;
  videoDurationSec: number;
  videoStyle: string;
  ttsVoice: string;
  ttsSpeed: string;
  pexelsEnabled: boolean;
  autoPublishReels: boolean;
  autoPublishStory: boolean;
  autoPublishTikTok: boolean;
  autoPublishLinkedIn: boolean;
  autoPublishYouTube: boolean;
};

type ScraperRun = {
  id: string;
  startedAt: string;
  finishedAt?: string;
  status: string;
  articlesFound: number;
  articlesSaved: number;
  triggerType: string;
  totalTokensIn: number;
  totalTokensOut: number;
  totalCostUsd: number;
  aiUsageLogs: AiUsageLog[];
};

type AiUsageLog = {
  id: string;
  operation: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  outputSummary?: string;
  createdAt: string;
};

type CostSummary = {
  costs: { today: number; month: number; total: number };
  tokens: { total: number };
  runs: { today: number; month: number; total: number };
  modelBreakdown: { model: string; calls: number; cost: number; tokens: number }[];
};

const DEFAULT_CONFIG: ScraperConfig = {
  intervalHours: 6,
  scheduledTimes: "[]",
  useScheduledTimes: false,
  isEnabled: true,
  maxArticlesPerRun: 3,
  aiModel: "gpt-4o-mini",
  aiTemperature: 0.7,
  systemPrompt: DEFAULT_PROMPT,
  videoDurationSec: 30,
  videoStyle: "journalism",
  ttsVoice: "pt-BR-AntonioNeural",
  ttsSpeed: "+5%",
  pexelsEnabled: true,
  autoPublishReels: false,
  autoPublishStory: false,
  autoPublishTikTok: false,
  autoPublishLinkedIn: false,
  autoPublishYouTube: false,
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatDuration(start: string, end?: string): string {
  if (!end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

function formatCost(usd: number): string {
  if (usd === 0) return "$0.00";
  if (usd < 0.001) return `$${usd.toFixed(6)}`;
  if (usd < 1) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

function Stars({ n }: { n: number }) {
  return (
    <span className="text-amber-500 text-xs">
      {"★".repeat(n)}{"☆".repeat(5 - n)}
    </span>
  );
}

// ─── COUNTDOWN TIMER ─────────────────────────────────────────────────────────

function useCountdownTimer(config: ScraperConfig) {
  const [remaining, setRemaining] = useState<string>("—");
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (!config.isEnabled) { 
      setRemaining("Desabilitado"); 
      setPct(0); 
      return; 
    }

    const tick = () => {
      const now = new Date();

      if (config.useScheduledTimes) {
        let times: string[] = [];
        try { times = JSON.parse(config.scheduledTimes); } catch { times = []; }
        if (times.length === 0) { 
          setRemaining("Nenhum horário configurado"); 
          setPct(0); 
          return; 
        }

        const sorted = [...times].sort();
        const nowHHMM = now.toTimeString().slice(0, 5);
        const next = sorted.find(t => t > nowHHMM) ?? sorted[0];
        const [h, m] = next.split(":").map(Number);
        const nextDate = new Date(now);
        nextDate.setHours(h, m, 0, 0);
        if (nextDate <= now) nextDate.setDate(nextDate.getDate() + 1);

        const diff = nextDate.getTime() - now.getTime();
        const totalMs = 24 * 60 * 60 * 1000;
        const secs = Math.floor(diff / 1000);
        const hh = Math.floor(secs / 3600);
        const mm = Math.floor((secs % 3600) / 60);
        const ss = secs % 60;
        setRemaining(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")} (às ${next})`);
        setPct(Math.max(0, 100 - (diff / totalMs) * 100));
      } else {
        const intervalMs = config.intervalHours * 60 * 60 * 1000;
        const msSinceEpochMod = now.getTime() % intervalMs;
        const diff = intervalMs - msSinceEpochMod;
        const secs = Math.floor(diff / 1000);
        const hh = Math.floor(secs / 3600);
        const mm = Math.floor((secs % 3600) / 60);
        const ss = secs % 60;
        setRemaining(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`);
        setPct((msSinceEpochMod / intervalMs) * 100);
      }
    };

    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [config]);

  return { remaining, pct };
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export default function ScraperConfigPage() {
  const [config, setConfig] = useState<ScraperConfig>(DEFAULT_CONFIG);
  const [runs, setRuns] = useState<ScraperRun[]>([]);
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [showModelModal, setShowModelModal] = useState(false);
  const [newScheduleTime, setNewScheduleTime] = useState("08:00");

  const fetchAll = useCallback(async () => {
    const hdrs = { "x-worker-secret": SECRET, "Content-Type": "application/json" };
    try {
      const [cfgRes, runsRes, sumRes] = await Promise.all([
        fetch("/api/worker/config", { headers: hdrs }),
        fetch("/api/worker/runs", { headers: hdrs }),
        fetch("/api/worker/ai-usage/summary", { headers: hdrs }),
      ]);
      if (cfgRes.ok) setConfig(await cfgRes.json());
      if (runsRes.ok) setRuns(await runsRes.json());
      if (sumRes.ok) setSummary(await sumRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 30000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  const saveConfig = async (patch?: Partial<ScraperConfig>) => {
    setSaving(true);
    const toSave = { ...config, ...(patch ?? {}) };
    const hdrs = { "x-worker-secret": SECRET, "Content-Type": "application/json" };
    try {
      const res = await fetch("/api/worker/config", {
        method: "POST",
        headers: hdrs,
        body: JSON.stringify(toSave),
      });
      if (res.ok) {
        setConfig(await res.json());
        setSaved("Configuração salva com sucesso!");
        setTimeout(() => setSaved(null), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const scheduledTimes: string[] = useMemo(() => {
    try { return JSON.parse(config.scheduledTimes); } catch { return []; }
  }, [config.scheduledTimes]);

  const addScheduledTime = () => {
    if (!newScheduleTime || scheduledTimes.includes(newScheduleTime)) return;
    const updated = [...scheduledTimes, newScheduleTime].sort();
    setConfig(c => ({ ...c, scheduledTimes: JSON.stringify(updated) }));
  };

  const removeScheduledTime = (t: string) => {
    const updated = scheduledTimes.filter(x => x !== t);
    setConfig(c => ({ ...c, scheduledTimes: JSON.stringify(updated) }));
  };

  const { remaining, pct } = useCountdownTimer(config);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600" />
            Configuração do Scraper
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Controle do cron pipeline de coleta e geração automática de notícias.
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm"
          title="Sincronizar"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* TOAST SUCCESS */}
      {saved && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold shadow-xl shadow-emerald-600/10 flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-300">
          <Check className="w-4 h-4" />
          {saved}
        </div>
      )}

      {/* STATUS BANNER */}
      <div className={`p-6 rounded-2xl border transition-all ${
        config.isEnabled 
          ? "bg-emerald-50/50 border-emerald-200/60 shadow-sm" 
          : "bg-rose-50/50 border-rose-200/60 shadow-sm"}`}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className={`w-3 h-3 rounded-full ${config.isEnabled ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
              <h2 className={`font-black text-base ${config.isEnabled ? "text-emerald-950" : "text-rose-950"}`}>
                Coleta Automática: {config.isEnabled ? "ATIVA" : "DESATIVADA"}
              </h2>
            </div>
            {config.isEnabled && (
              <div className="space-y-1">
                <p className={`text-xs font-semibold ${config.isEnabled ? "text-emerald-800" : "text-rose-800"}`}>
                  ⏰ Próxima execução em: <span className="font-mono text-sm">{remaining}</span>
                </p>
                <div className="w-64 h-2 bg-emerald-100/80 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => saveConfig({ isEnabled: !config.isEnabled })}
            className={`px-5 py-2.5 rounded-xl text-xs font-black border transition-all ${
              config.isEnabled
                ? "bg-rose-100 hover:bg-rose-200/80 text-rose-700 border-rose-200/40"
                : "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
            }`}
          >
            {config.isEnabled ? "⏸ Pausar Coletas" : "▶ Ativar Coletas"}
          </button>
        </div>
      </div>

      {/* CUSTOS DE IA */}
      {summary && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
          <h3 className="font-black text-slate-800 text-sm tracking-tight flex items-center gap-2">
            <Coins className="w-4 h-4 text-indigo-600" />
            INVESTIMENTO EM IA & ACÚMULO
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Hoje", value: formatCost(summary.costs.today), sub: `${summary.runs.today} coleta(s)` },
              { label: "Este mês", value: formatCost(summary.costs.month), sub: `${summary.runs.month} coleta(s)` },
              { label: "Histórico Total", value: formatCost(summary.costs.total), sub: `${summary.runs.total} coleta(s)` },
              { label: "Total Tokens", value: summary.tokens.total.toLocaleString("pt-BR"), sub: "entradas + saídas" },
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-center space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</div>
                <div className="text-lg font-black text-slate-800 font-mono">{item.value}</div>
                <div className="text-[10px] font-medium text-slate-400">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* AGENDAMENTO E LIMITES */}
        <div className="md:col-span-2 space-y-6">
          
          {/* CONFIG AGENDAMENTO */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="font-black text-slate-800 text-sm tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Intervalo de Execução
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { value: false, label: "🔄 Por intervalo", desc: "Executa a cada N horas" },
                { value: true, label: "🕐 Horários fixos", desc: "Executa em horários específicos" },
              ].map(opt => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setConfig(c => ({ ...c, useScheduledTimes: opt.value }))}
                  className={`p-4 rounded-xl border-2 text-left space-y-1 transition-all ${
                    config.useScheduledTimes === opt.value
                      ? "bg-indigo-50/50 border-indigo-600 text-indigo-900"
                      : "bg-white border-slate-200/80 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="text-xs font-black">{opt.label}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{opt.desc}</div>
                </button>
              ))}
            </div>

            {!config.useScheduledTimes ? (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Intervalo entre coletas</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 focus:bg-white"
                  value={config.intervalHours}
                  onChange={e => setConfig(c => ({ ...c, intervalHours: Number(e.target.value) }))}
                >
                  {[1, 2, 3, 4, 6, 8, 12, 24].map(h => (
                    <option key={h} value={h}>{h === 1 ? "1 hora" : `${h} horas`}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase block">Horários de execução</label>
                <div className="flex flex-wrap gap-2">
                  {scheduledTimes.map(t => (
                    <span 
                      key={t} 
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50/80 text-indigo-700 font-bold text-xs rounded-full border border-indigo-100"
                    >
                      🕐 {t}
                      <button
                        onClick={() => removeScheduledTime(t)}
                        className="hover:text-rose-600 text-indigo-400 text-sm font-black p-0.5 rounded"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {scheduledTimes.length === 0 && (
                    <span className="text-xs text-slate-400 italic">Nenhum horário configurado.</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={newScheduleTime}
                    onChange={e => setNewScheduleTime(e.target.value)}
                    className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 focus:bg-white"
                  />
                  <button 
                    onClick={addScheduledTime}
                    className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button 
                onClick={() => saveConfig()} 
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/10 transition-all disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar Agendamento"}
              </button>
            </div>
          </div>

          {/* LIMITES DE COLETA */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="font-black text-slate-800 text-sm tracking-tight flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              Limites de Artigos & Fundo
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase block">Máx. artigos por coleta</label>
                <div className="flex gap-2">
                  {[3, 5, 7, 10].map(n => (
                    <button
                      key={n}
                      onClick={() => setConfig(c => ({ ...c, maxArticlesPerRun: n }))}
                      className={`flex-1 py-2 text-xs font-black rounded-lg border-2 transition-all ${
                        config.maxArticlesPerRun === n
                          ? "bg-indigo-50 border-indigo-600 text-indigo-700"
                          : "bg-white border-slate-200/60 hover:bg-slate-50"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-700">Fundo do Pexels</div>
                  <div className="text-[10px] text-slate-400 font-medium">Usar banco de vídeos em vez de sólido</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={config.pexelsEnabled} 
                    onChange={e => setConfig(c => ({ ...c, pexelsEnabled: e.target.checked }))} 
                  />
                  <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-100 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:width-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button 
                onClick={() => saveConfig()} 
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/10 transition-all disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar Configurações"}
              </button>
            </div>
          </div>
          
        </div>

        {/* MODELO DE IA */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
          <h3 className="font-black text-slate-800 text-sm tracking-tight flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-600" />
            Modelo de Inteligência
          </h3>

          {(() => {
            const m = AI_MODELS.find(x => x.id === config.aiModel) ?? AI_MODELS[0];
            return (
              <div className="bg-indigo-50/30 p-4 rounded-xl border border-indigo-100/50 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-extrabold text-slate-900 text-xs">{m.name}</div>
                    <div className="text-[10px] text-slate-400 font-semibold">{m.desc}</div>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-tight px-2 py-0.5 rounded-full border ${m.badgeColor}`}>
                    {m.badge}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold font-mono">
                  <span>📥 ${m.inputPrice}/1M tokens</span>
                  <span>📤 ${m.outputPrice}/1M tokens</span>
                </div>
                <Stars n={m.stars} />
              </div>
            );
          })()}

          <button
            onClick={() => setShowModelModal(true)}
            className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-black rounded-xl shadow-sm transition-all"
          >
            MUDAR MODELO DE IA
          </button>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-500">
              <span>Criatividade (Temp)</span>
              <span className="font-mono text-indigo-600">{config.aiTemperature.toFixed(2)}</span>
            </div>
            <input
              type="range" min={0} max={1} step={0.05}
              value={config.aiTemperature}
              onChange={e => setConfig(c => ({ ...c, aiTemperature: Number(e.target.value) }))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>Preciso</span><span>Criativo</span>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button 
              onClick={() => saveConfig()} 
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/10 transition-all disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar Modelo"}
            </button>
          </div>
        </div>

      </div>

      {/* PROMPT DO SISTEMA */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-black text-slate-800 text-sm tracking-tight flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            Prompt de Instrução do Sistema
          </h3>
          <div className="flex gap-2">
            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded border border-slate-100">
              {config.systemPrompt?.length ?? 0} chars
            </span>
            <button
              onClick={() => setConfig(c => ({ ...c, systemPrompt: DEFAULT_PROMPT }))}
              className="px-2.5 py-1 border border-slate-200 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-50"
            >
              Restaurar Padrão
            </button>
          </div>
        </div>

        {/* PRESETS DE OBJETIVOS */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
            🎯 Preset de Tom / Objetivo
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            {PROMPT_PRESETS.map(preset => {
              const isActive = config.systemPrompt === preset.prompt;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    const isDifferent = config.systemPrompt !== DEFAULT_PROMPT && config.systemPrompt !== preset.prompt;
                    if (isDifferent) {
                      const ok = confirm(`Substituir o prompt atual pelo preset "${preset.label}"?\n\nO conteúdo atual será sobrescrito.`);
                      if (!ok) return;
                    }
                    setConfig(c => ({ ...c, systemPrompt: preset.prompt }));
                  }}
                  className={`p-3 rounded-xl border text-left space-y-1 transition-all ${
                    isActive 
                      ? `${preset.color} border-2`
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="text-lg">{preset.emoji}</div>
                  <div className="text-xs font-black leading-tight truncate">
                    {preset.label.replace(preset.emoji + " ", "")}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200/60 rounded-xl flex items-start gap-2 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Variáveis suportadas: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">{"{duration_sec}"}</code> (duração em segundos) e <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">{"{style_instruction}"}</code> (estilo do roteiro).
          </span>
        </div>

        <textarea
          value={config.systemPrompt}
          onChange={e => setConfig(c => ({ ...c, systemPrompt: e.target.value }))}
          className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl p-4 text-xs font-mono focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 focus:bg-white min-h-[220px]"
        />

        <div className="flex justify-end">
          <button 
            onClick={() => saveConfig()} 
            disabled={saving}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/10 transition-all disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar Prompt"}
          </button>
        </div>
      </div>

      {/* CONFIGURAÇÃO DE VÍDEO */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
        <h3 className="font-black text-slate-800 text-sm tracking-tight flex items-center gap-2">
          <Video className="w-4 h-4 text-indigo-600" />
          Configurações de Áudio & Vídeo
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">Duração máxima</label>
            <select
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 focus:bg-white"
              value={config.videoDurationSec}
              onChange={e => setConfig(c => ({ ...c, videoDurationSec: Number(e.target.value) }))}
            >
              {VIDEO_DURATIONS.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">Voz TTS</label>
            <select
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 focus:bg-white"
              value={config.ttsVoice}
              onChange={e => setConfig(c => ({ ...c, ttsVoice: e.target.value }))}
            >
              {TTS_VOICES.map(v => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-500">
              <span>Velocidade da voz</span>
              <span className="font-mono text-indigo-600">{config.ttsSpeed}</span>
            </div>
            <input
              type="range" min={-20} max={30} step={5}
              value={parseInt(config.ttsSpeed)}
              onChange={e => { 
                const v = Number(e.target.value); 
                setConfig(c => ({ ...c, ttsSpeed: `${v >= 0 ? "+" : ""}${v}%` })); 
              }}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>-20% Lento</span><span>0% Normal</span><span>+30% Rápido</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
            🎬 Estilo de Narração
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {VIDEO_STYLES.map(style => (
              <button
                key={style.id}
                type="button"
                onClick={() => setConfig(c => ({ ...c, videoStyle: style.id }))}
                className={`p-3 rounded-xl border text-left space-y-1 transition-all ${
                  config.videoStyle === style.id
                    ? "bg-indigo-50 border-indigo-600 text-indigo-900 border-2"
                    : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="text-xs font-black">{style.label}</div>
                <div className="text-[9px] text-slate-400 font-semibold leading-tight">{style.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button 
            onClick={() => saveConfig()} 
            disabled={saving}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/10 transition-all disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar Configurações de Vídeo"}
          </button>
        </div>
      </div>

      {/* AUTO PUBLICACAO */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
        <h3 className="font-black text-slate-800 text-sm tracking-tight flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-600" />
          Publicação Automática Pós-Scraping
        </h3>
        <p className="text-slate-500 text-xs font-medium">
          Envie os vídeos recém-gerados para as seguintes plataformas de forma 100% automatizada.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {([
            { key: "autoPublishReels" as const, label: "📹 Reels", desc: "Insta/FB Permanent" },
            { key: "autoPublishStory" as const, label: "📸 Stories", desc: "Insta/FB 24 Horas" },
            { key: "autoPublishTikTok" as const, label: "🎵 TikTok", desc: "TikTok Video Post" },
            { key: "autoPublishLinkedIn" as const, label: "💼 LinkedIn", desc: "Artigo + Link" },
            { key: "autoPublishYouTube" as const, label: "▶️ YouTube", desc: "Shorts automático" },
          ] as { key: keyof ScraperConfig; label: string; desc: string }[]).map(({ key, label, desc }) => (
            <div 
              key={key} 
              onClick={() => setConfig(c => ({ ...c, [key]: !config[key] }))}
              className={`p-4 rounded-xl border text-left space-y-3 cursor-pointer select-none transition-all ${
                config[key]
                  ? "bg-indigo-50/50 border-indigo-600 text-indigo-950"
                  : "bg-white border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              <div className="space-y-0.5">
                <div className="text-xs font-black">{label}</div>
                <div className="text-[9px] text-slate-400 font-semibold leading-tight">{desc}</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={!!config[key]} 
                  onChange={() => {}} 
                />
                <div className="w-8 h-4 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:width-3 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button 
            onClick={() => saveConfig()} 
            disabled={saving}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/10 transition-all disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar Configurações"}
          </button>
        </div>
      </div>

      {/* HISTÓRICO DE COLETAS */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-black text-slate-800 text-sm tracking-tight flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            Histórico das Últimas Execuções
          </h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Auto-sync a cada 30s</span>
        </div>

        {runs.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs italic font-medium">
            Nenhuma execução registrada no banco de dados.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200/60 shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 font-bold uppercase tracking-wider text-slate-400 text-[9px]">
                  <th className="px-5 py-3">Início</th>
                  <th className="px-5 py-3">Duração</th>
                  <th className="px-5 py-3">Artigos</th>
                  <th className="px-5 py-3">Tokens</th>
                  <th className="px-5 py-3">Custo</th>
                  <th className="px-5 py-3">Gatilho</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {runs.map(run => {
                  const statusCfg: Record<string, { bg: string; color: string; label: string }> = {
                    RUNNING:  { bg: "bg-blue-50 text-blue-700 border-blue-200/60", label: "⏳ Rodando" },
                    SUCCESS:  { bg: "bg-emerald-50 text-emerald-700 border-emerald-200/60", label: "✅ Sucesso" },
                    PARTIAL:  { bg: "bg-amber-50 text-amber-700 border-amber-200/60", label: "⚠️ Parcial" },
                    FAILED:   { bg: "bg-rose-50 text-rose-700 border-rose-200/60", label: "❌ Falhou" },
                  };
                  const sc = statusCfg[run.status] ?? statusCfg.FAILED;
                  const isExpanded = expandedRun === run.id;

                  return (
                    <div key={run.id} className="table-row-group">
                      <tr
                        onClick={() => run.aiUsageLogs?.length && setExpandedRun(isExpanded ? null : run.id)}
                        className={`hover:bg-slate-50/50 transition-all ${run.aiUsageLogs?.length ? "cursor-pointer" : ""}`}
                      >
                        <td className="px-5 py-3 whitespace-nowrap text-slate-600 font-semibold">{fmtDate(run.startedAt)}</td>
                        <td className="px-5 py-3 whitespace-nowrap font-mono text-slate-400">{formatDuration(run.startedAt, run.finishedAt)}</td>
                        <td className="px-5 py-3 whitespace-nowrap font-bold text-slate-700">
                          {run.articlesSaved}
                          <span className="text-slate-400 font-medium">/{run.articlesFound}</span>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap font-mono text-slate-400">
                          {(run.totalTokensIn + run.totalTokensOut).toLocaleString("pt-BR")}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap font-mono font-bold text-slate-800">
                          {formatCost(run.totalCostUsd)}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            run.triggerType === "MANUAL" 
                              ? "bg-purple-50 text-purple-700 border border-purple-100" 
                              : "bg-slate-100 text-slate-600 border border-slate-200/40"}`}
                          >
                            {run.triggerType === "MANUAL" ? "⚡ Manual" : "🕒 Auto"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center whitespace-nowrap">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${sc.bg}`}>
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-400 text-right">
                          {run.aiUsageLogs?.length > 0 && (
                            isExpanded ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />
                          )}
                        </td>
                      </tr>
                      {isExpanded && run.aiUsageLogs?.map(log => (
                        <tr key={log.id} className="bg-slate-50/20 border-t border-b border-slate-100/50">
                          <td colSpan={8} className="px-8 py-3">
                            <div className="flex flex-col sm:flex-row justify-between gap-2 text-[10px] text-slate-500 font-medium">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">{log.model}</span>
                                <span>📥 {log.promptTokens} in · 📤 {log.completionTokens} out · Total: {log.totalTokens}</span>
                                {log.outputSummary && (
                                  <span className="italic text-slate-400">&quot;{log.outputSummary.slice(0, 70)}...&quot;</span>
                                )}
                              </div>
                              <span className="font-mono text-emerald-600 font-bold">{formatCost(log.costUsd)}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </div>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL SELEÇÃO MODELO DE IA */}
      {showModelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="font-black text-slate-800 text-base flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-600" />
                Selecionar Modelo de IA
              </h2>
              <button 
                onClick={() => setShowModelModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {AI_MODELS.map(m => (
                <div
                  key={m.id}
                  onClick={() => {
                    setConfig(c => ({ ...c, aiModel: m.id }));
                    setShowModelModal(false);
                  }}
                  className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all flex justify-between items-center gap-4 ${
                    config.aiModel === m.id
                      ? "bg-indigo-50/50 border-indigo-600 text-indigo-950"
                      : "bg-white border-slate-200/80 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="font-extrabold text-xs text-slate-900">{m.name}</div>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${m.badgeColor}`}>
                        {m.badge}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold">{m.desc}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-slate-400 font-bold font-mono">📥 ${m.inputPrice}</div>
                    <div className="text-[10px] text-slate-400 font-bold font-mono">📤 ${m.outputPrice}</div>
                    <Stars n={m.stars} />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-slate-400 text-center font-semibold">
              O modelo selecionado será aplicado na próxima execução do scraper.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

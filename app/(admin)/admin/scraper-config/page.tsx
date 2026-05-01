"use client";
import { useEffect, useRef, useState, useCallback } from "react";

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
    badgeColor: "#16a34a",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    inputPrice: 2.50,
    outputPrice: 10.00,
    desc: "Melhor qualidade de texto e reasoning",
    stars: 5,
    badge: "Melhor qualidade",
    badgeColor: "#7c3aed",
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    inputPrice: 10.00,
    outputPrice: 30.00,
    desc: "Contexto de 128k tokens — textos longos",
    stars: 5,
    badge: "Contexto longo",
    badgeColor: "#2563eb",
  },
  {
    id: "gpt-4",
    name: "GPT-4",
    inputPrice: 30.00,
    outputPrice: 60.00,
    desc: "Modelo legado, robusto e confiável",
    stars: 4,
    badge: "Legado",
    badgeColor: "#64748b",
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    inputPrice: 0.50,
    outputPrice: 1.50,
    desc: "Mais barato — para testes e rascunhos",
    stars: 3,
    badge: "Econômico",
    badgeColor: "#ea580c",
  },
];

const VIDEO_STYLES = [
  { id: "journalism", label: "📰 Jornalismo", desc: "Informativo, direto, objetivo" },
  { id: "story", label: "📖 História", desc: "Narrativo, envolvente, início/meio/fim" },
  { id: "ad", label: "📣 Propaganda", desc: "Persuasivo, apelativo, focado em benefícios" },
  { id: "funny", label: "😂 Engraçado", desc: "Humor, descontraído, mas informativo" },
  { id: "ironic", label: "😏 Irônico", desc: "Sarcástico, crítico, embasado nos fatos" },
  { id: "polemico", label: "🔥 Polêmico", desc: "Provocador, emocional, foco no viral" },
  { id: "breaking", label: "⚡ Breaking News", desc: "Urgência máxima, sensação de ao vivo" },
  { id: "investigativo", label: "🔍 Investigativo", desc: "Revela detalhes ocultos, jornalismo profundo" },
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

// ─── PRESETS DE OBJETIVO DE PROMPT ───────────────────────────────────────────

const PROMPT_PRESETS = [
  {
    id: "jornalistico",
    label: "📰 Jornalístico",
    emoji: "📰",
    desc: "Rigoroso, imparcial, editorial",
    color: "#1d4ed8",
    bg: "#dbeafe",
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
    color: "#dc2626",
    bg: "#fee2e2",
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
    color: "#0891b2",
    bg: "#e0f2fe",
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
    color: "#7c3aed",
    bg: "#ede9fe",
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
    color: "#ea580c",
    bg: "#ffedd5",
    prompt: `Você é um âncora de telejornal ao vivo cobrindo uma notícia de última hora.
Transmita urgência e importância. O leitor deve sentir que precisa saber AGORA.
JSON obrigatório:
- "title": Manchete de URGÊNCIA (ex: "AGORA: X acontece e pode mudar Y")
- "summary": Boletim urgente de até {duration_sec}s, direto ao ponto, sem enrolação. Máx 450 chars.
- "content_html": Artigo em HTML com <p>, <h2>, <b>. Estrutura: fato principal → quem → quando → impacto imediato.
{style_instruction}`,
  },
  {
    id: "investigativo",
    label: "🔍 Investigativo",
    emoji: "🔍",
    desc: "Revela detalhes ocultos, profundo",
    color: "#374151",
    bg: "#f3f4f6",
    prompt: `Você é um jornalista investigativo que revela o que a mídia mainstream não conta.
Questione, aprofunde, mostre os bastidores e o impacto oculto da notícia.
JSON obrigatório:
- "title": Título que sugere revelação (ex: "O que ninguém está falando sobre X")
- "summary": Roteiro de até {duration_sec}s revelando camadas da história. Tom: suspense investigativo. Máx 450 chars.
- "content_html": Artigo em HTML com <p>, <h2>, <b>. Mostre: contexto oculto → quem se beneficia → o que pode acontecer.
{style_instruction}`,
  },
  {
    id: "opiniao",
    label: "💬 Opinativo",
    emoji: "💬",
    desc: "Editorial, provocativo, toma partido",
    color: "#0f766e",
    bg: "#ccfbf1",
    prompt: `Você é um colunista de tecnologia com posição clara e fundamentada.
Expresse uma opinião forte sobre o tema, defendendo um ponto de vista com argumentos sólidos.
JSON obrigatório:
- "title": Título opinativo e direto (ex: "Por que X é um erro" ou "X vai mudar tudo — e ninguém está preparado")
- "summary": Roteiro opinativo de até {duration_sec}s com tese + argumento + conclusão. Máx 450 chars.
- "content_html": Artigo em HTML com <p>, <h2>, <b>. Tom: assertivo, fundamentado, sem neutralidade.
{style_instruction}`,
  },
  {
    id: "marketing",
    label: "📣 Marketing",
    emoji: "📣",
    desc: "Persuasivo, CTA, orientado a conversão",
    color: "#d97706",
    bg: "#fef3c7",
    prompt: `Você é um copywriter especialista em marketing digital e conversão.
Transforme a notícia em conteúdo que educa E gera interesse em produtos/serviços relacionados.
JSON obrigatório:
- "title": Título que desperta desejo ou resolve uma dor (ex: "Como X pode te poupar Y" ou "A solução para Z finalmente chegou")
- "summary": Roteiro de até {duration_sec}s com problema → solução → CTA implícito. Máx 450 chars.
- "content_html": Artigo em HTML com <p>, <h2>, <b>. Estrutura AIDA: Atenção → Interesse → Desejo → Ação.
{style_instruction}`,
  },
  {
    id: "humor",
    label: "😂 Humor",
    emoji: "😂",
    desc: "Entretenimento, leveza, compartilhável",
    color: "#b45309",
    bg: "#fef9c3",
    prompt: `Você é um comediante digital especializado em humor inteligente sobre tecnologia.
Transforme a notícia em conteúdo divertido, leve e compartilhável — sem perder a informação real.
JSON obrigatório:
- "title": Título engraçado ou com trocadilho inteligente
- "summary": Roteiro de até {duration_sec}s com humor situacional, analogias cômicas ou ironia afiada. Máx 450 chars.
- "content_html": Artigo em HTML com <p>, <h2>, <b>. Informe de forma divertida — educação disfarçada de entretenimento.
{style_instruction}`,
  },
  {
    id: "analise",
    label: "📊 Análise Profunda",
    emoji: "📊",
    desc: "Estratégico, comparativo, com dados",
    color: "#4338ca",
    bg: "#e0e7ff",
    prompt: `Você é um analista estratégico de mercado de tecnologia.
Forneça uma análise profunda com comparações, dados e perspectivas de longo prazo.
JSON obrigatório:
- "title": Título analítico (ex: "X vs Y: o que os dados revelam" ou "Análise: o que X significa para o setor")
- "summary": Síntese analítica de até {duration_sec}s com dados-chave e conclusão estratégica. Máx 450 chars.
- "content_html": Artigo em HTML com <p>, <h2>, <b>. Inclua: contexto histórico → análise atual → cenários futuros.
{style_instruction}`,
  },
];


// ─── TIPOS ────────────────────────────────────────────────────────────────────

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
    <span style={{ color: "#f59e0b", fontSize: 13 }}>
      {"★".repeat(n)}{"☆".repeat(5 - n)}
    </span>
  );
}

// ─── COUNTDOWN ────────────────────────────────────────────────────────────────

function CountdownTimer({ config }: { config: ScraperConfig }) {
  const [remaining, setRemaining] = useState<string>("—");
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (!config.isEnabled) { setRemaining("Desabilitado"); setPct(0); return; }

    const tick = () => {
      const now = new Date();

      if (config.useScheduledTimes) {
        let times: string[] = [];
        try { times = JSON.parse(config.scheduledTimes); } catch { times = []; }
        if (times.length === 0) { setRemaining("Nenhum horário configurado"); setPct(0); return; }

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
        // Aproxima baseado na hora atual módulo intervalo
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

  // ── FETCH CONFIG ──
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

  // ── SAVE CONFIG ──
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

  // ── SCHEDULED TIMES ──
  const scheduledTimes: string[] = (() => {
    try { return JSON.parse(config.scheduledTimes); } catch { return []; }
  })();

  const addScheduledTime = () => {
    if (!newScheduleTime || scheduledTimes.includes(newScheduleTime)) return;
    const updated = [...scheduledTimes, newScheduleTime].sort();
    setConfig(c => ({ ...c, scheduledTimes: JSON.stringify(updated) }));
  };

  const removeScheduledTime = (t: string) => {
    const updated = scheduledTimes.filter(x => x !== t);
    setConfig(c => ({ ...c, scheduledTimes: JSON.stringify(updated) }));
  };

  const { remaining, pct } = CountdownTimer({ config });

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40, height: 40, border: "4px solid #e5e7eb",
            borderTop: "4px solid #6366f1", borderRadius: "50%",
            animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
          }} />
          <p style={{ color: "#6b7280" }}>Carregando configurações...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 60px" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .cfg-card { background: white; border-radius: 14px; padding: 24px; box-shadow: 0 1px 6px rgba(0,0,0,0.08); border: 1px solid #e5e7eb; margin-bottom: 20px; animation: fadeIn 0.3s; }
        .cfg-label { display: block; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
        .cfg-input { width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid #d1d5db; font-size: 14px; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
        .cfg-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .cfg-select { padding: 8px 12px; border-radius: 8px; border: 1px solid #d1d5db; font-size: 14px; background: white; cursor: pointer; }
        .cfg-btn { padding: 9px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; font-size: 13px; transition: all 0.2s; }
        .cfg-btn-primary { background: #6366f1; color: white; }
        .cfg-btn-primary:hover { background: #4f46e5; }
        .cfg-btn-secondary { background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }
        .cfg-btn-secondary:hover { background: #e5e7eb; }
        .cfg-btn-danger { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        .cfg-btn-danger:hover { background: #fee2e2; }
        .toggle { position: relative; width: 44px; height: 24px; cursor: pointer; }
        .toggle input { opacity: 0; width: 0; height: 0; }
        .toggle-slider { position: absolute; top: 0; left: 0; right: 0; bottom: 0; border-radius: 24px; transition: 0.3s; }
        .toggle input:checked + .toggle-slider { background: #6366f1; }
        .toggle input:not(:checked) + .toggle-slider { background: #d1d5db; }
        .toggle-slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.3s; }
        .toggle input:checked + .toggle-slider:before { transform: translateX(20px); }
        .chip { display: inline-flex; align-items: center; gap: 6px; padding: "3px 10px"; border-radius: 999px; font-size: 13px; font-weight: 600; }
        .row { display: flex; gap: 20px; flex-wrap: wrap; }
        .row > * { flex: 1; min-width: 200px; }
        .model-card { border: 2px solid transparent; border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s; }
        .model-card:hover { border-color: #6366f1; background: #f5f3ff; }
        .model-card.selected { border-color: #6366f1; background: #f5f3ff; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "#111827" }}>
          ⚙️ Configuração do Scraper
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>
          Controle tudo do pipeline de coleta e geração automática de conteúdo
        </p>
      </div>

      {/* ── TOAST ── */}
      {saved && (
        <div style={{
          position: "fixed", top: 80, right: 24, zIndex: 9999,
          background: "#065f46", color: "white", padding: "12px 20px",
          borderRadius: 10, fontWeight: 600, fontSize: 14,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)", animation: "fadeIn 0.3s",
        }}>
          ✅ {saved}
        </div>
      )}

      {/* ── CARD 1: STATUS ── */}
      <div className="cfg-card" style={{
        background: config.isEnabled
          ? "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)"
          : "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
        border: config.isEnabled ? "1px solid #86efac" : "1px solid #fca5a5",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{
                width: 12, height: 12, borderRadius: "50%",
                background: config.isEnabled ? "#16a34a" : "#dc2626",
                boxShadow: config.isEnabled ? "0 0 0 4px #bbf7d0" : "0 0 0 4px #fecaca",
                display: "inline-block",
              }} />
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: config.isEnabled ? "#14532d" : "#991b1b" }}>
                Coleta Automática {config.isEnabled ? "ATIVA" : "DESABILITADA"}
              </h2>
            </div>
            {config.isEnabled && (
              <>
                <p style={{ margin: 0, fontSize: 13, color: "#166534" }}>
                  ⏰ Próxima execução em: <strong style={{ fontFamily: "monospace", fontSize: 15 }}>{remaining}</strong>
                </p>
                <div style={{ marginTop: 8, width: 260, height: 8, background: "#bbf7d0", borderRadius: 999 }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: "#16a34a", borderRadius: 999, transition: "width 1s linear" }} />
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#166534" }}>
                  {config.useScheduledTimes ? "Modo: horários fixos" : `Modo: intervalo de ${config.intervalHours}h`}
                </p>
              </>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              className="cfg-btn"
              style={{
                background: config.isEnabled ? "#fef2f2" : "#f0fdf4",
                color: config.isEnabled ? "#dc2626" : "#16a34a",
                border: config.isEnabled ? "1px solid #fca5a5" : "1px solid #86efac",
              }}
              onClick={() => saveConfig({ isEnabled: !config.isEnabled })}
            >
              {config.isEnabled ? "⏸ Desabilitar" : "▶ Habilitar"}
            </button>
          </div>
        </div>
      </div>

      {/* ── CARD 2: CUSTOS ── */}
      {summary && (
        <div className="cfg-card">
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#111827" }}>💰 Custos de IA</h3>
          <div className="row">
            {[
              { label: "Hoje", value: formatCost(summary.costs.today), sub: `${summary.runs.today} coleta(s)` },
              { label: "Este mês", value: formatCost(summary.costs.month), sub: `${summary.runs.month} coleta(s)` },
              { label: "Total histórico", value: formatCost(summary.costs.total), sub: `${summary.runs.total} coleta(s)` },
              { label: "Tokens totais", value: summary.tokens.total.toLocaleString("pt-BR"), sub: "todos os tempos" },
            ].map(item => (
              <div key={item.label} style={{ textAlign: "center", padding: "12px", background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#111827", fontFamily: "monospace", marginTop: 4 }}>{item.value}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{item.sub}</div>
              </div>
            ))}
          </div>
          {summary.modelBreakdown.length > 0 && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "#f9fafb", borderRadius: 8, fontSize: 13, color: "#374151" }}>
              <span style={{ fontWeight: 600 }}>Modelo mais usado:</span>{" "}
              {summary.modelBreakdown[0].model}{" "}
              <span style={{ color: "#6b7280" }}>({summary.modelBreakdown[0].calls} chamada{summary.modelBreakdown[0].calls !== 1 ? "s" : ""} · {formatCost(summary.modelBreakdown[0].cost)})</span>
            </div>
          )}
        </div>
      )}

      {/* ── CARD 3: AGENDAMENTO ── */}
      <div className="cfg-card">
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#111827" }}>⏱ Agendamento</h3>
        <div style={{ display: "flex", gap: 24, marginBottom: 20 }}>
          {[
            { value: false, label: "🔄 Por intervalo", desc: "Executa a cada N horas" },
            { value: true, label: "🕐 Horários fixos", desc: "Executa em horários específicos" },
          ].map(opt => (
            <label key={String(opt.value)} style={{
              flex: 1, padding: 16, border: `2px solid ${config.useScheduledTimes === opt.value ? "#6366f1" : "#e5e7eb"}`,
              borderRadius: 10, cursor: "pointer", background: config.useScheduledTimes === opt.value ? "#f5f3ff" : "white",
              transition: "all 0.2s",
            }}>
              <input
                type="radio"
                checked={config.useScheduledTimes === opt.value}
                onChange={() => setConfig(c => ({ ...c, useScheduledTimes: opt.value }))}
                style={{ marginRight: 8 }}
              />
              <span style={{ fontWeight: 700, fontSize: 14 }}>{opt.label}</span>
              <p style={{ margin: "4px 0 0 24px", fontSize: 12, color: "#6b7280" }}>{opt.desc}</p>
            </label>
          ))}
        </div>

        {!config.useScheduledTimes ? (
          <div>
            <label className="cfg-label">Intervalo entre coletas</label>
            <select
              className="cfg-select"
              value={config.intervalHours}
              onChange={e => setConfig(c => ({ ...c, intervalHours: Number(e.target.value) }))}
            >
              {[1, 2, 3, 4, 6, 8, 12, 24].map(h => (
                <option key={h} value={h}>{h === 1 ? "1 hora" : `${h} horas`}</option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="cfg-label">Horários de execução</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {scheduledTimes.map(t => (
                <span key={t} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "5px 12px", borderRadius: 999,
                  background: "#ede9fe", color: "#5b21b6", fontWeight: 700, fontSize: 14,
                }}>
                  🕐 {t}
                  <button
                    onClick={() => removeScheduledTime(t)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#7c3aed", fontWeight: 900, fontSize: 16, lineHeight: 1, padding: 0 }}
                  >
                    ×
                  </button>
                </span>
              ))}
              {scheduledTimes.length === 0 && (
                <span style={{ color: "#9ca3af", fontSize: 13 }}>Nenhum horário adicionado</span>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="time"
                value={newScheduleTime}
                onChange={e => setNewScheduleTime(e.target.value)}
                className="cfg-input"
                style={{ width: "auto" }}
              />
              <button className="cfg-btn cfg-btn-secondary" onClick={addScheduledTime}>
                + Adicionar horário
              </button>
            </div>
          </div>
        )}

        <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
          <button className="cfg-btn cfg-btn-primary" onClick={() => saveConfig()} disabled={saving}>
            {saving ? "Salvando..." : "💾 Salvar agendamento"}
          </button>
        </div>
      </div>

      {/* ── CARD 4: LIMITES ── */}
      <div className="cfg-card">
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#111827" }}>📊 Limites de Coleta</h3>
        <div className="row">
          <div>
            <label className="cfg-label">Máx. artigos por coleta</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[3, 5, 7, 10].map(n => (
                <button
                  key={n}
                  onClick={() => setConfig(c => ({ ...c, maxArticlesPerRun: n }))}
                  style={{
                    padding: "8px 20px", borderRadius: 8, border: "2px solid",
                    borderColor: config.maxArticlesPerRun === n ? "#6366f1" : "#e5e7eb",
                    background: config.maxArticlesPerRun === n ? "#f5f3ff" : "white",
                    color: config.maxArticlesPerRun === n ? "#6366f1" : "#374151",
                    fontWeight: 700, cursor: "pointer", fontSize: 15, transition: "all 0.2s",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div>
              <label className="cfg-label">Fundo Pexels</label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={config.pexelsEnabled}
                  onChange={e => setConfig(c => ({ ...c, pexelsEnabled: e.target.checked }))}
                />
                <span className="toggle-slider" />
              </label>
            </div>
            <span style={{ fontSize: 13, color: "#6b7280", marginTop: 18 }}>
              {config.pexelsEnabled ? "✅ Usando Pexels como fundo" : "⬛ Usando fundo sólido"}
            </span>
          </div>
        </div>
        <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
          <button className="cfg-btn cfg-btn-primary" onClick={() => saveConfig()} disabled={saving}>
            {saving ? "Salvando..." : "💾 Salvar"}
          </button>
        </div>
      </div>

      {/* ── CARD 5: MODELO DE IA ── */}
      <div className="cfg-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111827" }}>🤖 Modelo de IA</h3>
          <button className="cfg-btn cfg-btn-secondary" onClick={() => setShowModelModal(true)}>
            Trocar modelo
          </button>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            {(() => {
              const m = AI_MODELS.find(x => x.id === config.aiModel) ?? AI_MODELS[0];
              return (
                <div style={{ padding: "14px 16px", background: "#f5f3ff", borderRadius: 10, border: "1px solid #c4b5fd" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: "#4c1d95" }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{m.desc}</div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
                      background: m.badgeColor + "20", color: m.badgeColor,
                    }}>{m.badge}</span>
                  </div>
                  <div style={{ marginTop: 8, display: "flex", gap: 12, fontSize: 12, color: "#6b7280" }}>
                    <span>📥 ${m.inputPrice}/1M tokens</span>
                    <span>📤 ${m.outputPrice}/1M tokens</span>
                  </div>
                  <Stars n={m.stars} />
                </div>
              );
            })()}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="cfg-label">Temperatura (criatividade)</label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="range" min={0} max={1} step={0.05}
                value={config.aiTemperature}
                onChange={e => setConfig(c => ({ ...c, aiTemperature: Number(e.target.value) }))}
                style={{ flex: 1, accentColor: "#6366f1" }}
              />
              <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#6366f1", minWidth: 32 }}>
                {config.aiTemperature.toFixed(2)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af" }}>
              <span>Preciso</span><span>Criativo</span>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
          <button className="cfg-btn cfg-btn-primary" onClick={() => saveConfig()} disabled={saving}>
            {saving ? "Salvando..." : "💾 Salvar"}
          </button>
        </div>
      </div>

      {/* ── CARD 6: PROMPT ── */}
      <div className="cfg-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111827" }}>📝 Prompt do Sistema</h3>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>{config.systemPrompt?.length ?? 0} caracteres</span>
            <button
              className="cfg-btn cfg-btn-secondary"
              style={{ fontSize: 12 }}
              onClick={() => setConfig(c => ({ ...c, systemPrompt: DEFAULT_PROMPT }))}
            >
              ↺ Restaurar padrão
            </button>
          </div>
        </div>

        {/* ─── Seletor de Objetivo de Prompt ─────────────────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          <label className="cfg-label" style={{ marginBottom: 8, display: "block" }}>
            🎯 Objetivo do Conteúdo — selecione para carregar um prompt base
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 8 }}>
            {PROMPT_PRESETS.map(preset => {
              const isActive = config.systemPrompt === preset.prompt;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    const isDifferent = config.systemPrompt !== DEFAULT_PROMPT && config.systemPrompt !== preset.prompt;
                    if (isDifferent) {
                      const ok = confirm(`Substituir o prompt atual pelo preset "${preset.label}"?\n\nO conteúdo atual será sobrescrito.`);
                      if (!ok) return;
                    }
                    setConfig(c => ({ ...c, systemPrompt: preset.prompt }));
                  }}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: `2px solid ${isActive ? preset.color : "#e5e7eb"}`,
                    background: isActive ? preset.bg : "white",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: 18, marginBottom: 3 }}>{preset.emoji}</div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: isActive ? preset.color : "#374151", lineHeight: 1.2 }}>
                    {preset.label.replace(preset.emoji + " ", "")}
                  </div>
                  <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2, lineHeight: 1.3 }}>{preset.desc}</div>
                </button>
              );
            })}
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 11, color: "#9ca3af" }}>
            💡 Após selecionar, você pode editar livremente o prompt abaixo antes de salvar.
          </p>
        </div>

        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8, padding: "8px 12px", background: "#fef9c3", borderRadius: 8, border: "1px solid #fde68a" }}>
          💡 Use <code style={{ background: "#fef3c7", padding: "1px 4px", borderRadius: 4 }}>{"{duration_sec}"}</code> para inserir a duração do vídeo e{" "}
          <code style={{ background: "#fef3c7", padding: "1px 4px", borderRadius: 4 }}>{"{style_instruction}"}</code> para inserir o estilo de narração.
        </div>
        <textarea
          value={config.systemPrompt}
          onChange={e => setConfig(c => ({ ...c, systemPrompt: e.target.value }))}
          className="cfg-input"
          style={{ minHeight: 200, fontFamily: "Fira Code, Courier New, monospace", fontSize: 13, lineHeight: 1.6, resize: "vertical" }}
        />
        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
          <button className="cfg-btn cfg-btn-primary" onClick={() => saveConfig()} disabled={saving}>
            {saving ? "Salvando..." : "💾 Salvar prompt"}
          </button>
        </div>
      </div>


      {/* ── CARD 7: VÍDEO ── */}
      <div className="cfg-card">
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#111827" }}>🎬 Configurações de Vídeo</h3>
        <div className="row">
          <div>
            <label className="cfg-label">Duração máxima do vídeo</label>
            <select
              className="cfg-select"
              style={{ width: "100%" }}
              value={config.videoDurationSec}
              onChange={e => setConfig(c => ({ ...c, videoDurationSec: Number(e.target.value) }))}
            >
              {VIDEO_DURATIONS.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="cfg-label">Voz TTS</label>
            <select
              className="cfg-select"
              style={{ width: "100%" }}
              value={config.ttsVoice}
              onChange={e => setConfig(c => ({ ...c, ttsVoice: e.target.value }))}
            >
              {TTS_VOICES.map(v => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label className="cfg-label">Estilo de narração</label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {VIDEO_STYLES.map(style => (
              <button
                key={style.id}
                onClick={() => setConfig(c => ({ ...c, videoStyle: style.id }))}
                style={{
                  padding: "10px 16px", borderRadius: 10, border: "2px solid",
                  borderColor: config.videoStyle === style.id ? "#6366f1" : "#e5e7eb",
                  background: config.videoStyle === style.id ? "#f5f3ff" : "white",
                  cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13, color: config.videoStyle === style.id ? "#4f46e5" : "#374151" }}>
                  {style.label}
                </div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{style.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label className="cfg-label">
            Velocidade da voz: <code style={{ fontFamily: "monospace", color: "#6366f1" }}>{config.ttsSpeed}</code>
          </label>
          <input
            type="range" min={-20} max={30} step={5}
            value={parseInt(config.ttsSpeed)}
            onChange={e => { const v = Number(e.target.value); setConfig(c => ({ ...c, ttsSpeed: `${v >= 0 ? "+" : ""}${v}%` })); }}
            style={{ width: "100%", accentColor: "#6366f1" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af" }}>
            <span>-20% (lento)</span><span>0% (normal)</span><span>+30% (rápido)</span>
          </div>
        </div>

        <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
          <button className="cfg-btn cfg-btn-primary" onClick={() => saveConfig()} disabled={saving}>
            {saving ? "Salvando..." : "💾 Salvar configurações de vídeo"}
          </button>
        </div>
      </div>

      {/* ── CARD 8B: PUBLICAÇÃO AUTOMÁTICA ── */}
      <div className="cfg-card">
        <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: "#111827" }}>📡 Publicação Automática</h3>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6b7280" }}>
          Plataformas onde os vídeos serão publicados automaticamente após serem gerados pelo scraper.
          Configure as credenciais em <strong>Hub de Integrações</strong>.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {([
            { key: "autoPublishReels" as const, label: "📹 Instagram/FB Reels", desc: "Reel permanente" },
            { key: "autoPublishStory" as const, label: "📸 Instagram/FB Story", desc: "Dura 24 horas" },
            { key: "autoPublishTikTok" as const, label: "🎵 TikTok", desc: "Publicação no TikTok" },
            { key: "autoPublishLinkedIn" as const, label: "💼 LinkedIn", desc: "Post de texto + link" },
            { key: "autoPublishYouTube" as const, label: "▶️ YouTube Shorts", desc: "Publicação automática no YouTube" },
          ] as { key: keyof ScraperConfig; label: string; desc: string }[]).map(({ key, label, desc }) => (
            <label key={key} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 16px",
              border: `2px solid ${config[key] ? "#6366f1" : "#e5e7eb"}`,
              borderRadius: 10, cursor: "pointer",
              background: config[key] ? "#f5f3ff" : "white",
              transition: "all 0.2s",
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: config[key] ? "#4f46e5" : "#374151" }}>{label}</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>{desc}</div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={!!config[key]}
                  onChange={e => setConfig(c => ({ ...c, [key]: e.target.checked }))}
                />
                <span className="toggle-slider" />
              </label>
            </label>
          ))}
        </div>
        <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
          <button className="cfg-btn cfg-btn-primary" onClick={() => saveConfig()} disabled={saving}>
            {saving ? "Salvando..." : "💾 Salvar"}
          </button>
        </div>
      </div>

      {/* ── CARD 9: HISTÓRICO ── */}
      <div className="cfg-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111827" }}>📋 Histórico de Coletas</h3>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>Atualiza a cada 30s</span>
        </div>

        {runs.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#9ca3af", border: "1px dashed #d1d5db", borderRadius: 10 }}>
            Nenhuma coleta registrada ainda.
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          {runs.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Início", "Duração", "Artigos", "Tokens", "Custo", "Tipo", "Status", ""].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#6b7280", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap", fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runs.map(run => {
                  const statusCfg: Record<string, { bg: string; color: string; label: string }> = {
                    RUNNING:  { bg: "#dbeafe", color: "#1d4ed8", label: "⏳ Rodando" },
                    SUCCESS:  { bg: "#d1fae5", color: "#065f46", label: "✅ Sucesso" },
                    PARTIAL:  { bg: "#fef3c7", color: "#92400e", label: "⚠️ Parcial" },
                    FAILED:   { bg: "#fee2e2", color: "#991b1b", label: "❌ Falhou" },
                  };
                  const sc = statusCfg[run.status] ?? statusCfg.FAILED;
                  const isExpanded = expandedRun === run.id;

                  return (
                    <>
                      <tr
                        key={run.id}
                        style={{ borderBottom: "1px solid #f3f4f6", cursor: run.aiUsageLogs?.length ? "pointer" : "default" }}
                        onClick={() => run.aiUsageLogs?.length && setExpandedRun(isExpanded ? null : run.id)}
                      >
                        <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{fmtDate(run.startedAt)}</td>
                        <td style={{ padding: "10px 12px", fontFamily: "monospace", color: "#6b7280" }}>{formatDuration(run.startedAt, run.finishedAt)}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ fontWeight: 700 }}>{run.articlesSaved}</span>
                          <span style={{ color: "#9ca3af" }}>/{run.articlesFound}</span>
                        </td>
                        <td style={{ padding: "10px 12px", fontFamily: "monospace", color: "#6b7280" }}>
                          {(run.totalTokensIn + run.totalTokensOut).toLocaleString("pt-BR")}
                        </td>
                        <td style={{ padding: "10px 12px", fontFamily: "monospace", color: run.totalCostUsd > 0 ? "#111827" : "#9ca3af" }}>
                          {formatCost(run.totalCostUsd)}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                            background: run.triggerType === "MANUAL" ? "#ede9fe" : "#f3f4f6",
                            color: run.triggerType === "MANUAL" ? "#6d28d9" : "#4b5563",
                          }}>
                            {run.triggerType === "MANUAL" ? "⚡ Manual" : "🕒 Auto"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: sc.bg, color: sc.color }}>
                            {sc.label}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", color: "#9ca3af", fontSize: 16 }}>
                          {run.aiUsageLogs?.length > 0 ? (isExpanded ? "▲" : "▼") : ""}
                        </td>
                      </tr>
                      {isExpanded && run.aiUsageLogs?.map(log => (
                        <tr key={log.id} style={{ background: "#fafafa", borderBottom: "1px solid #f3f4f6" }}>
                          <td colSpan={8} style={{ padding: "8px 24px" }}>
                            <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap", fontSize: 12 }}>
                              <span style={{ fontFamily: "monospace", background: "#ede9fe", color: "#5b21b6", padding: "2px 8px", borderRadius: 6 }}>{log.model}</span>
                              <span style={{ color: "#6b7280" }}>📥 {log.promptTokens} in · 📤 {log.completionTokens} out · Total: {log.totalTokens}</span>
                              <span style={{ color: "#059669", fontFamily: "monospace", fontWeight: 700 }}>{formatCost(log.costUsd)}</span>
                              {log.outputSummary && (
                                <span style={{ color: "#374151", fontStyle: "italic" }}>&quot;{log.outputSummary.slice(0, 60)}&hellip;&quot;</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── MODAL: MODELO DE IA ── */}
      {showModelModal && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}
          onClick={() => setShowModelModal(false)}
        >
          <div
            style={{ background: "white", borderRadius: 16, padding: 28, maxWidth: 640, width: "100%", animation: "fadeIn 0.2s" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>🤖 Selecionar Modelo de IA</h2>
              <button
                onClick={() => setShowModelModal(false)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280" }}
              >✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {AI_MODELS.map(m => (
                <div
                  key={m.id}
                  className={`model-card ${config.aiModel === m.id ? "selected" : ""}`}
                  onClick={() => { setConfig(c => ({ ...c, aiModel: m.id })); setShowModelModal(false); }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        {config.aiModel === m.id && <span style={{ color: "#6366f1", fontWeight: 900 }}>✓</span>}
                        <span style={{ fontWeight: 800, fontSize: 15 }}>{m.name}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                          background: m.badgeColor + "20", color: m.badgeColor,
                        }}>{m.badge}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>{m.desc}</p>
                    </div>
                    <div style={{ textAlign: "right", minWidth: 120 }}>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>📥 <strong>${m.inputPrice}</strong>/1M in</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>📤 <strong>${m.outputPrice}</strong>/1M out</div>
                      <Stars n={m.stars} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ margin: "16px 0 0", fontSize: 12, color: "#9ca3af", textAlign: "center" }}>
              Clique no modelo para selecioná-lo. Salve as configurações após fechar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

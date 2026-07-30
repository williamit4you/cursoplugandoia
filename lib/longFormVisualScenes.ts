export type LongFormVisualBrief = {
  index: number;
  title?: string;
  items?: string[];
  visualType?: "TITLE" | "BULLETS" | "TIMELINE" | "FOCUS" | "NUMBER" | "MEDIA" | "QUOTE";
  centerText?: string;
  surroundingTexts?: string[];
  number?: string;
  numberContext?: string;
};

type VisualAsset = { url: string; source?: string; query?: string };

const PALETTES = [
  { backgroundColor: "#0f172a", accentColor: "#38bdf8", textColor: "#f8fafc" },
  { backgroundColor: "#312e81", accentColor: "#fbbf24", textColor: "#ffffff" },
  { backgroundColor: "#064e3b", accentColor: "#34d399", textColor: "#ecfdf5" },
  { backgroundColor: "#7f1d1d", accentColor: "#fb7185", textColor: "#fff7ed" },
  { backgroundColor: "#3b0764", accentColor: "#c084fc", textColor: "#faf5ff" },
  { backgroundColor: "#0c4a6e", accentColor: "#22d3ee", textColor: "#ecfeff" },
];

function words(text: string) {
  return String(text || "").trim().split(/\s+/).filter(Boolean);
}

function shorten(text: string, max = 86) {
  const clean = String(text || "").replace(/\s+/g, " ").replace(/^[,;:.\-\s]+/, "").trim();
  if (clean.length <= max) return clean;
  const clipped = clean.slice(0, max + 1);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, lastSpace > max * 0.65 ? lastSpace : max).trim()}…`;
}

function sentences(text: string) {
  const matches = String(text || "").replace(/\s+/g, " ").match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  return matches.map((item) => item.trim()).filter(Boolean);
}

function sentenceItems(text: string) {
  const direct = sentences(text)
    .map((item) => shorten(item.replace(/[.!?]+$/, ""), 96))
    .filter((item) => item.length >= 12);
  if (direct.length >= 2) return direct.slice(0, 3);
  const chunkWords = words(text);
  const size = Math.max(6, Math.ceil(chunkWords.length / 3));
  return Array.from({ length: 3 }, (_, index) =>
    shorten(chunkWords.slice(index * size, (index + 1) * size).join(" "), 96),
  ).filter((item) => item.length >= 8);
}

export function splitNarrationIntoVisualChunks(narrationText: string, desiredCount: number) {
  const sourceSentences = sentences(narrationText);
  if (!sourceSentences.length) return [];
  const targetCount = Math.max(1, Math.min(desiredCount, sourceSentences.length));
  const totalWords = words(narrationText).length;
  const targetWords = Math.max(12, Math.ceil(totalWords / targetCount));
  const chunks: string[] = [];
  let current: string[] = [];
  let currentWords = 0;

  for (const sentence of sourceSentences) {
    const amount = words(sentence).length;
    const remainingSentences = sourceSentences.length - chunks.length;
    if (current.length && currentWords + amount > targetWords && chunks.length < targetCount - 1) {
      chunks.push(current.join(" "));
      current = [];
      currentWords = 0;
    }
    current.push(sentence);
    currentWords += amount;
    if (currentWords >= targetWords && chunks.length < targetCount - 1 && remainingSentences > 1) {
      chunks.push(current.join(" "));
      current = [];
      currentWords = 0;
    }
  }
  if (current.length) chunks.push(current.join(" "));
  return chunks;
}

function topicFor(index: number, count: number, subtopics: string[]) {
  if (!subtopics.length) return "";
  return subtopics[Math.min(subtopics.length - 1, Math.floor((index * subtopics.length) / Math.max(1, count)))];
}

function meaningfulTitle(chunk: string, topic: string, brief?: LongFormVisualBrief) {
  const generated = shorten(brief?.title || "", 72);
  if (generated && !/^ponto importante\b/i.test(generated)) return generated;
  const first = sentences(chunk)[0] || chunk;
  const derived = shorten(first.replace(/[.!?]+$/, ""), 72);
  return derived || shorten(topic.replace(/[.!?]+$/, ""), 72);
}

function meaningfulItems(chunk: string, title: string, brief?: LongFormVisualBrief) {
  const generated = Array.isArray(brief?.items)
    ? brief.items.map((item) => shorten(item, 96)).filter((item) => item && item.toLowerCase() !== title.toLowerCase())
    : [];
  return (generated.length >= 2 ? generated : sentenceItems(chunk)).slice(0, 3);
}

export function buildLongFormVisualScenes(params: {
  title: string;
  narrationText: string;
  subtopics: string[];
  durationSec: number;
  assets: VisualAsset[];
  briefs?: LongFormVisualBrief[];
}) {
  const desiredCount = Math.max(24, Math.min(48, Math.round(params.durationSec / 15)));
  const chunks = splitNarrationIntoVisualChunks(params.narrationText, desiredCount);
  if (!chunks.length) throw new Error("A narracao nao possui conteudo suficiente para criar o plano visual.");
  const briefs = new Map((params.briefs || []).map((brief) => [Number(brief.index), brief]));
  const totalWords = chunks.reduce((total, chunk) => total + words(chunk).length, 0);
  const rawDurations = chunks.map((chunk) =>
    (params.durationSec * words(chunk).length) / Math.max(1, totalWords),
  );
  const durations = rawDurations.map((duration) => Math.max(1, Math.floor(duration)));
  let remainingSeconds = params.durationSec - durations.reduce((total, duration) => total + duration, 0);
  const fractionalOrder = rawDurations
    .map((duration, index) => ({ index, fraction: duration - Math.floor(duration) }))
    .sort((a, b) => b.fraction - a.fraction);
  for (let index = 0; remainingSeconds > 0; index += 1, remainingSeconds -= 1) {
    durations[fractionalOrder[index % fractionalOrder.length].index] += 1;
  }

  return chunks.map((chunk, index) => {
    const brief = briefs.get(index);
    const topic = topicFor(index, chunks.length, params.subtopics);
    const isSectionStart =
      index === 0 ||
      topic !== topicFor(index - 1, chunks.length, params.subtopics);
    const derivedTitle = meaningfulTitle(chunk, topic, brief);
    const title =
      isSectionStart && !brief?.title && topic
        ? shorten(topic.replace(/[.!?]+$/, ""), 72)
        : derivedTitle;
    const items = meaningfulItems(chunk, title, brief);
    const palette = PALETTES[index % PALETTES.length];
    const durationSec = durations[index];
    const numericMatch = chunk.match(/\b(?:R\$\s*)?\d+(?:[.,]\d+)?(?:%|x| vezes)?\b/i);
    const requestedType = String(brief?.visualType || "").toUpperCase();
    const media = params.assets.length ? params.assets[index % params.assets.length]?.url : null;
    const common = {
      ...palette,
      fontFamily: "Arial Black, Arial",
      title,
      sourceText: chunk,
    };

    if (index === 0) {
      return {
        id: `scene-${index + 1}`,
        sceneTemplate: "TitleScene",
        durationSec,
        props: { ...common, title: shorten(params.title, 82), subtitle: title },
      };
    }
    if ((requestedType === "MEDIA" || index % 6 === 4) && media) {
      return {
        id: `scene-${index + 1}`,
        sceneTemplate: "RetentionScene",
        durationSec,
        props: { ...common, url: media, title },
      };
    }
    if ((requestedType === "NUMBER" || (numericMatch && index % 4 === 0)) && (brief?.number || numericMatch)) {
      return {
        id: `scene-${index + 1}`,
        sceneTemplate: "BigNumberScene",
        durationSec,
        props: {
          ...common,
          number: shorten(brief?.number || numericMatch?.[0] || "", 18),
          subtitle: shorten(brief?.numberContext || title, 90),
        },
      };
    }
    if (isSectionStart || requestedType === "TITLE") {
      return {
        id: `scene-${index + 1}`,
        sceneTemplate: "TitleScene",
        durationSec,
        props: { ...common, title, subtitle: items[0] || shorten(chunk, 100) },
      };
    }
    if (requestedType === "FOCUS" || index % 7 === 5) {
      return {
        id: `scene-${index + 1}`,
        sceneTemplate: "CircleHighlightScene",
        durationSec,
        props: {
          ...common,
          centerText: shorten(brief?.centerText || title.split(/\s+/).slice(0, 3).join(" "), 24),
          surroundingTexts: (
            Array.isArray(brief?.surroundingTexts) && brief!.surroundingTexts!.length >= 2
              ? brief!.surroundingTexts!
              : items
          ).map((item) => shorten(item, 28)).slice(0, 4),
          circleColor: palette.accentColor,
        },
      };
    }
    if (requestedType === "TIMELINE" || index % 5 === 2) {
      return {
        id: `scene-${index + 1}`,
        sceneTemplate: "TimelineScene",
        durationSec,
        props: {
          ...common,
          items: items.map((item, itemIndex) => ({
            label: ["Entenda", "Observe", "Aplique"][itemIndex] || `Etapa ${itemIndex + 1}`,
            text: item,
          })),
        },
      };
    }
    if (requestedType === "QUOTE") {
      return {
        id: `scene-${index + 1}`,
        sceneTemplate: "QuoteScene",
        durationSec,
        props: { ...common, quote: items[0] || shorten(chunk, 130), author: topic || "Ideia central" },
      };
    }
    return {
      id: `scene-${index + 1}`,
      sceneTemplate: "BulletListScene",
      durationSec,
      props: { ...common, items },
    };
  });
}

import "server-only";

function clip(value: string, max: number) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(0, max - 3)).trim()}...`;
}

function formatEditionDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date);
}

export function ensureDailyNewsHashtag(title: string) {
  const clean = clip(title, 92);
  if (/#[\p{L}\p{N}_-]+/u.test(clean)) return clean;
  return clip(`${clean} #Noticias`, 98);
}

export function buildDailyNewsClickbaitTitle(params: {
  editionDate: Date;
  mainHeadline: string;
}) {
  const dateLabel = formatEditionDate(params.editionDate);
  const headline = clip(params.mainHeadline, 58);
  return ensureDailyNewsHashtag(`Noticias ${dateLabel}: ${headline} e muito mais!`);
}

export function buildDailyNewsThumbnailCopy(params: {
  editionDate: Date;
  mainHeadline: string;
}) {
  const dateLabel = formatEditionDate(params.editionDate);
  const headline = clip(params.mainHeadline, 62);
  return {
    eyebrow: `NOTICIAS ${dateLabel}`,
    title: clip(headline, 54),
    subtitle: "Veja isso e muito mais no resumo do dia",
    badge: "RESUMO DO DIA",
  };
}

export function buildDailyNewsThumbnailVideoSpec(params: {
  editionDate: Date;
  mainHeadline: string;
}) {
  const copy = buildDailyNewsThumbnailCopy(params);
  return {
    version: 1 as const,
    meta: {
      aspectRatio: "16:9" as const,
      fps: 30,
      theme: {
        id: "daily-news-thumbnail",
        name: "Daily News Thumbnail",
        backgroundColor: "#050816",
        textColor: "#f8fafc",
        accentColor: "#ef4444",
        secondaryColor: "#1d4ed8",
        surfaceColor: "#0f172a",
        fontFamily: "Arial Black, Arial, sans-serif",
      },
    },
    content: {
      title: copy.title,
      description: copy.subtitle,
      narrationText: "",
    },
    scenes: [
      {
        id: "daily-news-thumb",
        sceneTemplate: "TitleScene" as const,
        durationSec: 1,
        props: {
          title: copy.title,
          subtitle: `${copy.eyebrow} • ${copy.subtitle}`,
          backgroundColor: "linear-gradient(135deg, #050816 0%, #0f172a 45%, #1d4ed8 100%)",
          textColor: "#f8fafc",
          accentColor: "#ef4444",
          fontFamily: "Arial Black, Arial, sans-serif",
        },
      },
    ],
  };
}

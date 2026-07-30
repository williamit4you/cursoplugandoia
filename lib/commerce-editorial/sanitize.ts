import type { EditorialArticle } from "./agents";

function sanitizePublicText(value: string, storeName: string) {
  const destination = `o botão para acessar ${storeName} nesta página`;
  const escapedStore = storeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return String(value || "")
    .replace(/\[([^\]]+)\]\(\s*https?:\/\/[^)\s]+\s*\)/gi, (_match, label) => `${label} por meio de ${destination}`)
    .replace(/https?:\/\/[^\s)\]}>,]+/gi, destination)
    .replace(/\b(?:www\.)?[a-z0-9-]+(?:\.[a-z]{2,})(?:\.[a-z]{2,})?(?:\/[^\s)\]}>,]*)?/gi, destination)
    .replace(new RegExp(`visitar o site oficial da loja em\\s+${escapedStore}\\s+por meio de o botão para acessar ${escapedStore} nesta página`, "gi"), `usar o botão para acessar ${storeName} nesta página`)
    .replace(/por meio de o botão/gi, "pelo botão")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function sanitizeEditorialArticleLinks(article: EditorialArticle, storeName: string): EditorialArticle {
  return {
    ...article,
    title: sanitizePublicText(article.title, storeName),
    metaDescription: sanitizePublicText(article.metaDescription, storeName),
    primaryKeyword: sanitizePublicText(article.primaryKeyword, storeName),
    secondaryKeywords: (article.secondaryKeywords || []).map((item) => sanitizePublicText(item, storeName)),
    eyebrow: sanitizePublicText(article.eyebrow, storeName),
    intro: sanitizePublicText(article.intro, storeName),
    specs: (article.specs || []).map((item) => ({
      label: sanitizePublicText(item.label, storeName),
      value: sanitizePublicText(item.value, storeName),
    })),
    sections: (article.sections || []).map((section) => ({
      title: sanitizePublicText(section.title, storeName),
      paragraphs: (section.paragraphs || []).map((item) => sanitizePublicText(item, storeName)),
      ...(section.bullets ? { bullets: section.bullets.map((item) => sanitizePublicText(item, storeName)) } : {}),
    })),
    faq: (article.faq || []).map((item) => ({
      question: sanitizePublicText(item.question, storeName),
      answer: sanitizePublicText(item.answer, storeName),
    })),
    sourceNotes: (article.sourceNotes || []).map((item) => sanitizePublicText(item, storeName)),
  };
}

export function editorialArticleHasPublicUrl(article: EditorialArticle) {
  return /https?:\/\/|\[[^\]]+\]\(\s*https?:\/\/|\bwww\.|\b[a-z0-9-]+\.(?:com|com\.br|net|org|shop)\b/i.test(JSON.stringify(article));
}

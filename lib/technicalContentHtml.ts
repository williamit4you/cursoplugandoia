const ALLOWED_TAGS = new Set(["p", "h2", "h3", "h4", "ul", "ol", "li", "strong", "em", "a", "blockquote", "pre", "code", "br"]);

export function htmlToPlainText(value: string) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function safeHref(value: string) {
  const href = value.trim();
  return /^\/(?!\/)/.test(href) ? href : "";
}

/** Restricts AI-authored HTML to the small semantic subset used by public articles. */
export function sanitizeTechnicalArticleHtml(value: string) {
  return String(value || "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed|form)[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<\/?([a-z][a-z0-9]*)\b([^>]*)>/gi, (match, rawTag: string, rawAttributes: string) => {
      const tag = rawTag.toLowerCase();
      const closing = /^<\//.test(match);
      if (!ALLOWED_TAGS.has(tag)) return "";
      if (closing) return `</${tag}>`;
      if (tag !== "a") return `<${tag}>`;
      const hrefMatch = rawAttributes.match(/\bhref\s*=\s*(["'])(.*?)\1/i) || rawAttributes.match(/\bhref\s*=\s*([^\s>]+)/i);
      const href = safeHref(hrefMatch?.[2] || hrefMatch?.[1] || "");
      return href ? `<a href="${href.replace(/"/g, "&quot;")}">` : "<a>";
    })
    .trim();
}

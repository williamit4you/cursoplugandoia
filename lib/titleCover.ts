function escapeXml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function splitTitle(title: string, maxLineLength = 24) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLineLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.slice(0, 4);
}

export function buildTitleCoverDataUrl(title: string, eyebrow = "PORTAL INTELIGENTE") {
  const safeTitle = title.trim() || "Nova publicação";
  const lines = splitTitle(safeTitle);
  const lineHeight = 78;
  const startY = 420 - ((lines.length - 1) * lineHeight) / 2;

  const titleMarkup = lines
    .map(
      (line, index) =>
        `<text x="96" y="${startY + index * lineHeight}" fill="#fff8dc" font-size="58" font-weight="800" font-family="Arial, Helvetica, sans-serif">${escapeXml(line)}</text>`
    )
    .join("");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#091540" />
          <stop offset="45%" stop-color="#3b0764" />
          <stop offset="100%" stop-color="#0f766e" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" rx="44" fill="url(#bg)" />
      <circle cx="1360" cy="170" r="180" fill="rgba(255,255,255,0.08)" />
      <circle cx="1280" cy="720" r="240" fill="rgba(251,191,36,0.14)" />
      <rect x="96" y="96" width="320" height="44" rx="22" fill="rgba(255,248,220,0.15)" />
      <text x="132" y="126" fill="#fde68a" font-size="24" font-weight="700" font-family="Arial, Helvetica, sans-serif">${escapeXml(eyebrow)}</text>
      <rect x="96" y="170" width="220" height="10" rx="5" fill="#f59e0b" />
      ${titleMarkup}
      <text x="96" y="804" fill="rgba(255,255,255,0.82)" font-size="28" font-weight="600" font-family="Arial, Helvetica, sans-serif">Conteúdo automatizado • IA • automação • agentes</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

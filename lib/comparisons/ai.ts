import { buildComparisonTitle, comparisonSlugify, currentComparisonYear, escapeHtml, safeJsonParse, trimText } from "@/lib/comparisons/utils";

type ProductBrief = {
  id: string;
  sortOrder: number;
  affiliateUrl: string;
  sourceDomain: string;
  storeName: string | null;
  productTitle: string | null;
  brand: string | null;
  priceText: string | null;
  shortDescription: string | null;
  bulletPointsJson: string;
  specsJson: string;
  prosJson: string;
  consJson: string;
};

type ComparisonInput = {
  theme: string;
  targetYear?: number | null;
  items: ProductBrief[];
};

function buildFaq(theme: string) {
  return [
    {
      question: `Como escolher a melhor ${theme}?`,
      answer: `Observe conforto, capacidade suportada, niveis de resistencia, painel, tamanho e o tipo de uso que voce pretende fazer em casa.`,
    },
    {
      question: `${theme} mais cara sempre e melhor?`,
      answer: `Nem sempre. Modelos mais caros podem trazer mais ajustes e acabamento, mas o melhor custo-beneficio depende do seu perfil de uso.`,
    },
    {
      question: `Vale a pena comparar as especificacoes antes de comprar ${theme}?`,
      answer: `Sim. Especificacoes e descricoes ajudam a evitar compras fora do seu objetivo de treino e espaco disponivel.`,
    },
    {
      question: `Onde encontrar os links dos produtos analisados?`,
      answer: `No final do artigo reunimos todos os links para conferir preco e disponibilidade.`,
    },
  ];
}

function buildFallbackArticle(input: ComparisonInput) {
  const validItems = input.items.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const count = validItems.length;
  const year = input.targetYear || currentComparisonYear();
  const title = buildComparisonTitle(input.theme, count, year);
  const themeLabel = input.theme;
  const introSummary = `Selecionamos ${count} opcoes de ${themeLabel} para comparar descricao, faixas de preco e informacoes tecnicas disponiveis nas paginas dos produtos.`;
  const seoTitle = `${title} | Comparativo completo`;
  const metaDescription = trimText(
    `Veja o comparativo com ${count} opcoes de ${themeLabel}, pontos fortes, limitacoes e links para conferir preco em ${year}.`,
    155
  );

  const sections = validItems
    .map((item, index) => {
      const bullets = safeJsonParse<string[]>(item.bulletPointsJson, []);
      const specs = safeJsonParse<Record<string, string>>(item.specsJson, {});
      const pros = safeJsonParse<string[]>(item.prosJson, []);
      const cons = safeJsonParse<string[]>(item.consJson, []);
      const specsEntries = Object.entries(specs).slice(0, 5);
      return `
        <section id="produto-${index + 1}">
          <h2>${index + 1}. ${escapeHtml(item.productTitle || "Produto sem titulo identificado")}</h2>
          <p>${escapeHtml(item.shortDescription || `Este modelo apareceu no nosso comparativo de ${themeLabel} com base nos dados disponiveis na pagina do marketplace.`)}</p>
          <p><strong>Faixa de preco observada:</strong> ${escapeHtml(item.priceText || "Nao informada claramente")}</p>
          ${pros.length > 0 ? `<h3>Pontos positivos</h3><ul>${pros.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}</ul>` : ""}
          ${cons.length > 0 ? `<h3>Pontos de atencao</h3><ul>${cons.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}</ul>` : ""}
          ${bullets.length > 0 ? `<h3>Destaques descritos na pagina</h3><ul>${bullets.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}</ul>` : ""}
          ${specsEntries.length > 0 ? `<h3>Especificacoes encontradas</h3><ul>${specsEntries.map(([key, value]) => `<li><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</li>`).join("")}</ul>` : ""}
          <p><strong>Indicado para:</strong> ${escapeHtml(`Quem busca ${themeLabel} com perfil de uso alinhado aos destaques acima e quer validar preco e disponibilidade na loja.`)}</p>
        </section>
      `;
    })
    .join("\n");

  const whereToBuy = `
    <section id="onde-comprar">
      <h2>Onde comprar</h2>
      <p>Confira os links reunidos abaixo para verificar preco, parcelamento e disponibilidade atual de cada modelo.</p>
      <ul>
        ${validItems
          .map(
            (item, index) =>
              `<li><a href="${escapeHtml(item.affiliateUrl)}" target="_blank" rel="nofollow sponsored noopener noreferrer">${index + 1}. ${escapeHtml(item.productTitle || `Produto ${index + 1}`)} - ${escapeHtml(item.storeName || item.sourceDomain)}</a></li>`
          )
          .join("")}
      </ul>
      <p><small>Alguns links podem gerar comissao de afiliado sem custo adicional para voce.</small></p>
    </section>
  `;

  const contentHtml = `
    <p>${escapeHtml(introSummary)}</p>
    <section>
      <h2>Como escolhemos</h2>
      <p>Comparamos os links enviados considerando informacoes publicas visiveis nas paginas dos produtos, como descricao, faixa de preco, itens destacados e especificacoes tecnicas disponiveis.</p>
    </section>
    <section>
      <h2>Resumo rapido</h2>
      <p>Se voce quer uma ${escapeHtml(themeLabel)} para uso residencial, vale comparar conforto, nivel de resistencia, estrutura e clareza das informacoes tecnicas antes de fechar a compra.</p>
    </section>
    ${sections}
    <section>
      <h2>Qual e a melhor ${escapeHtml(themeLabel)} para cada perfil?</h2>
      <p>O melhor modelo depende do seu espaco, intensidade de treino, necessidade de ajustes e do nivel de informacao que cada fabricante oferece na pagina do produto.</p>
    </section>
    <section>
      <h2>Conclusao</h2>
      <p>Este comparativo serve como atalho para reduzir duvidas iniciais. Antes de comprar, confira detalhes atualizados de preco, garantia e disponibilidade diretamente na loja.</p>
    </section>
    <section>
      <h2>Perguntas frequentes</h2>
      ${buildFaq(themeLabel)
        .map((faq) => `<h3>${escapeHtml(faq.question)}</h3><p>${escapeHtml(faq.answer)}</p>`)
        .join("")}
    </section>
    ${whereToBuy}
  `.trim();

  const faqJson = buildFaq(themeLabel);
  const slugSuggestion = comparisonSlugify(`${themeLabel}-${year}`);
  const schemaJson = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: title,
        description: metaDescription,
      },
      {
        "@type": "ItemList",
        itemListElement: validItems.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.productTitle || `Produto ${index + 1}`,
          url: item.affiliateUrl,
        })),
      },
    ],
  };

  return {
    title,
    slugSuggestion,
    introSummary,
    seoTitle,
    metaDescription,
    heroTitle: title,
    heroSubtitle: introSummary,
    contentHtml,
    faqJson,
    schemaJson,
    model: "fallback-template",
  };
}

function extractJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function generateComparisonArticle(input: ComparisonInput, model = "gpt-4o-mini", temperature = 0.3) {
  const fallback = buildFallbackArticle(input);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallback;

  const productCount = input.items.length;
  const targetYear = input.targetYear || currentComparisonYear();
  const comparisonBriefJson = {
    theme: input.theme,
    targetYear,
    productCount,
    products: input.items.map((item, index) => ({
      position: index + 1,
      productTitle: item.productTitle,
      brand: item.brand,
      storeName: item.storeName,
      priceText: item.priceText,
      shortDescription: item.shortDescription,
      bulletPoints: safeJsonParse<string[]>(item.bulletPointsJson, []),
      specs: safeJsonParse<Record<string, string>>(item.specsJson, {}),
      pros: safeJsonParse<string[]>(item.prosJson, []),
      cons: safeJsonParse<string[]>(item.consJson, []),
      affiliateUrl: item.affiliateUrl,
    })),
  };

  const system = [
    "Voce e um redator senior de SEO para afiliados em portugues do Brasil.",
    "Escreva comparativos confiaveis, claros e uteis.",
    "Nao invente especificacoes ausentes.",
    "Retorne apenas JSON valido.",
  ].join("\n");

  const user = [
    "Crie um artigo comparativo SEO com base no briefing abaixo.",
    JSON.stringify(comparisonBriefJson, null, 2),
    "",
    "Retorne JSON com:",
    "- title",
    "- slugSuggestion",
    "- introSummary",
    "- seoTitle",
    "- metaDescription",
    "- heroTitle",
    "- heroSubtitle",
    "- contentHtml",
    "- faqJson",
    "- schemaJson",
    "",
    `O H1 deve ser "${buildComparisonTitle(input.theme, productCount, targetYear)}".`,
    "O contentHtml deve conter introducao, criterios, uma secao por produto, conclusao, FAQ e uma secao final Onde comprar.",
    "Na secao final Onde comprar inclua todos os links de afiliados recebidos.",
  ].join("\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    return fallback;
  }

  const data = await res.json();
  const parsed = extractJsonObject(String(data?.choices?.[0]?.message?.content ?? ""));
  if (!parsed || !parsed.contentHtml) {
    return fallback;
  }

  return {
    ...fallback,
    ...parsed,
    faqJson: parsed.faqJson || fallback.faqJson,
    schemaJson: parsed.schemaJson || fallback.schemaJson,
    model,
  };
}

export async function reviewComparisonArticle(input: {
  theme: string;
  targetYear?: number | null;
  validCount: number;
  article: any;
}) {
  const fallbackTitle = buildComparisonTitle(input.theme, input.validCount, input.targetYear || currentComparisonYear());
  const approved =
    String(input.article?.title || "").trim() === fallbackTitle &&
    String(input.article?.contentHtml || "").includes("Onde comprar");

  return {
    approved,
    corrections: approved
      ? []
      : [
          "O titulo precisa refletir a quantidade real de produtos validos.",
          'A secao "Onde comprar" precisa existir no HTML final.',
        ],
  };
}

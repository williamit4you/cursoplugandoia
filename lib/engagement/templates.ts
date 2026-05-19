import "server-only";

export type EngagementTemplateType =
  | "SHOPEE_FAZ_SENTIDO"
  | "INUTIL_ATE_VER"
  | "NAO_COMPRE_SEM_VER"
  | "COMPARACAO"
  | "3_PRODUTOS_HOJE"
  | "PARECE_MENTIRA"
  | "PERGUNTA_SIMPLES"
  | "SERIE";

export type EngagementTemplate = {
  type: EngagementTemplateType;
  name: string;
  objective: "RETENCAO" | "COMENTARIO" | "COMPARTILHAMENTO" | "UTILIDADE";
  personaName: string;
  // Guidance text to feed into the prompt.
  guidance: string;
};

export const DEFAULT_PERSONA = "IA caçadora de produtos";

export const ENGAGEMENT_TEMPLATES: EngagementTemplate[] = [
  {
    type: "SHOPEE_FAZ_SENTIDO",
    name: "Coisas da Shopee que fazem sentido",
    objective: "COMPARTILHAMENTO",
    personaName: DEFAULT_PERSONA,
    guidance:
      "Formato: descoberta útil e surpreendente. Foque em resolver um problema bobo do dia a dia e dar vontade de comentar/salvar.",
  },
  {
    type: "INUTIL_ATE_VER",
    name: "Parece inútil até você ver",
    objective: "RETENCAO",
    personaName: DEFAULT_PERSONA,
    guidance:
      "Formato: curiosidade. Comece com dúvida (inútil?) e vire o jogo mostrando o uso real de forma rápida.",
  },
  {
    type: "NAO_COMPRE_SEM_VER",
    name: "Não compre sem ver isso antes",
    objective: "RETENCAO",
    personaName: DEFAULT_PERSONA,
    guidance:
      "Formato: autoridade. Aponte um erro comum e ensine rapidamente o que observar antes de comprar.",
  },
  {
    type: "COMPARACAO",
    name: "Comparação (barato vs caro / Shopee vs outro)",
    objective: "RETENCAO",
    personaName: DEFAULT_PERSONA,
    guidance:
      "Formato: comparação com suspense. Não invente dados; compare por critérios humanos (uso, durabilidade percebida, praticidade).",
  },
  {
    type: "3_PRODUTOS_HOJE",
    name: "3 produtos que eu compraria hoje",
    objective: "RETENCAO",
    personaName: DEFAULT_PERSONA,
    guidance:
      "Formato: rápido e dinâmico. Se for 1 produto só, adapte como '3 motivos para eu comprar hoje'.",
  },
  {
    type: "PARECE_MENTIRA",
    name: "Coisas que parecem mentira",
    objective: "COMPARTILHAMENTO",
    personaName: DEFAULT_PERSONA,
    guidance:
      "Formato: transformação/antes-depois. Foque na parte visual e na reação.",
  },
  {
    type: "PERGUNTA_SIMPLES",
    name: "Pergunta simples (gera comentários)",
    objective: "COMENTARIO",
    personaName: DEFAULT_PERSONA,
    guidance:
      "Formato: pergunta direta no final. Faça o público escolher um lado (genial vs inútil, compraria vs não).",
  },
  {
    type: "SERIE",
    name: "Série (episódio)",
    objective: "RETENCAO",
    personaName: DEFAULT_PERSONA,
    guidance:
      "Formato: série. Escolha uma premissa (ex.: abaixo de R$30, parece caro mas é barato) e termine prometendo o próximo.",
  },
];


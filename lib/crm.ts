export const CRM_STAGE_LABELS: Record<string, string> = {
  LEAD: "Lead",
  CONTACTED: "Contato feito",
  PROPOSAL_SENT: "Proposta enviada",
  NEGOTIATION: "Negociação",
  WON: "Fechado (ganho)",
  LOST: "Fechado (perdido)",
};

export const CRM_ASSISTANT_SCOPE =
  "automação com n8n, agentes de IA, RAG, WhatsApp comercial, Evolution API, integrações, implantação, consultoria e dúvidas comerciais da Plugando IA";

const IN_SCOPE_KEYWORDS = [
  "autom",
  "n8n",
  "agent",
  "agente",
  "ia",
  "rag",
  "whatsapp",
  "evolution",
  "chatbot",
  "integra",
  "api",
  "implant",
  "consult",
  "crm",
  "lead",
  "vendas",
  "follow-up",
];

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export function buildWhatsAppHref(phone?: string | null, message?: string | null) {
  const normalized = normalizePhone(phone || "");
  if (!normalized) {
    return "https://wa.me/";
  }

  const encoded = encodeURIComponent(message || "Olá! Quero falar sobre automação e agentes de IA.");
  return `https://wa.me/${normalized}?text=${encoded}`;
}

export function isCrmAssistantInScope(message: string) {
  const lower = message.toLowerCase();
  return IN_SCOPE_KEYWORDS.some((keyword) => lower.includes(keyword));
}

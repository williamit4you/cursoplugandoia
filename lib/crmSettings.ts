import { prisma } from "@/lib/prisma";

const DEFAULT_SETTINGS = {
  whatsappEnabled: false,
  whatsappDisplayLabel: "Falar no WhatsApp",
  whatsappNumber: "",
  whatsappDefaultMessage: "Olá! Quero falar sobre automação, agentes de IA e WhatsApp.",
  evolutionEnabled: false,
  evolutionBaseUrl: "",
  evolutionApiKey: "",
  evolutionInstanceName: "",
  evolutionWebhookSecret: "",
  openAiModel: "gpt-4o-mini",
  assistantEnabled: true,
  assistantScope:
    "Automação com n8n, agentes de IA, RAG, WhatsApp, Evolution API, integrações e implantação comercial.",
  assistantSystemPrompt:
    "Você é um atendente comercial da Plugando IA. Tire dúvidas apenas sobre automação, n8n, agentes de IA, RAG, WhatsApp, Evolution API, integrações, implantação e consultoria. Se o assunto sair desse escopo, recuse com educação, explique o escopo atendido e convide o lead a voltar ao tema comercial.",
};

export async function getOrCreateCrmSettings() {
  const existing = await prisma.crmSettings.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    return existing;
  }

  return prisma.crmSettings.create({
    data: DEFAULT_SETTINGS,
  });
}

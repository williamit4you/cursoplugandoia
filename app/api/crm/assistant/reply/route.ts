import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireServerSession } from "@/lib/serverAuth";
import { CRM_ASSISTANT_SCOPE, isCrmAssistantInScope } from "@/lib/crm";
import { getOrCreateCrmSettings } from "@/lib/crmSettings";

export async function POST(req: NextRequest) {
  const session = await requireServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const contactId = body.contactId as string;
    const message = String(body.message || "").trim();

    if (!contactId || !message) {
      return NextResponse.json({ error: "contactId and message are required" }, { status: 400 });
    }

    const settings = await getOrCreateCrmSettings();
    const contact = await prisma.crmContact.findUnique({ where: { id: contactId } });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    let conversation = await prisma.crmConversation.findFirst({
      where: { contactId },
      orderBy: { updatedAt: "desc" },
    });

    if (!conversation) {
      conversation = await prisma.crmConversation.create({
        data: {
          contactId,
          channel: "WHATSAPP",
          status: "OPEN",
        },
      });
    }

    await prisma.crmMessage.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        direction: "INBOUND",
        content: message,
      },
    });

    await prisma.crmActivity.create({
      data: {
        contactId,
        type: "WHATSAPP",
        direction: "INBOUND",
        subject: "Mensagem recebida",
        content: message,
        authorUserId: (session.user as any).id,
      },
    });

    if (!settings.assistantEnabled || !isCrmAssistantInScope(message)) {
      const fallback =
        "Posso ajudar apenas com automação, n8n, agentes de IA, RAG, WhatsApp, Evolution API, integrações e implantação comercial. Se quiser, me diga sua dúvida dentro desse escopo.";

      await prisma.crmMessage.create({
        data: {
          conversationId: conversation.id,
          role: "assistant",
          direction: "OUTBOUND",
          content: fallback,
          model: settings.openAiModel,
          guardrailTriggered: true,
        },
      });

      await prisma.crmActivity.create({
        data: {
          contactId,
          type: "WHATSAPP",
          direction: "OUTBOUND",
          subject: "Resposta com guardrail",
          content: fallback,
          authorUserId: (session.user as any).id,
        },
      });

      return NextResponse.json({ reply: fallback, guarded: true });
    }

    const previousMessages = await prisma.crmMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 12,
    });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 400 });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: settings.openAiModel || "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content: `${settings.assistantSystemPrompt}\n\nEscopo permitido: ${settings.assistantScope || CRM_ASSISTANT_SCOPE}.`,
          },
          ...previousMessages.map((item) => ({
            role: item.role === "assistant" ? "assistant" : "user",
            content: item.content,
          })),
          {
            role: "user",
            content: `Lead: ${contact.name || "Sem nome"} | Interesse: ${contact.interestService || "não informado"}\nPergunta atual: ${message}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `OpenAI error: ${errorText}` }, { status: 500 });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return NextResponse.json({ error: "Empty assistant reply" }, { status: 500 });
    }

    await prisma.crmMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        direction: "OUTBOUND",
        content: reply,
        model: settings.openAiModel,
      },
    });

    await prisma.crmActivity.create({
      data: {
        contactId,
        type: "WHATSAPP",
        direction: "OUTBOUND",
        subject: "Resposta IA",
        content: reply,
        authorUserId: (session.user as any).id,
      },
    });

    await prisma.crmContact.update({
      where: { id: contactId },
      data: { lastContactAt: new Date() },
    });

    return NextResponse.json({ reply, guarded: false });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate assistant reply" }, { status: 500 });
  }
}

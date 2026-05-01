import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCrmSettings } from "@/lib/crmSettings";
import { requireServerSession } from "@/lib/serverAuth";

export async function GET() {
  const session = await requireServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await getOrCreateCrmSettings();
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load CRM settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const current = await getOrCreateCrmSettings();
    const body = await req.json();

    const updated = await prisma.crmSettings.update({
      where: { id: current.id },
      data: {
        whatsappEnabled: body.whatsappEnabled ?? current.whatsappEnabled,
        whatsappDisplayLabel: body.whatsappDisplayLabel ?? current.whatsappDisplayLabel,
        whatsappNumber: body.whatsappNumber ?? current.whatsappNumber,
        whatsappDefaultMessage: body.whatsappDefaultMessage ?? current.whatsappDefaultMessage,
        evolutionEnabled: body.evolutionEnabled ?? current.evolutionEnabled,
        evolutionBaseUrl: body.evolutionBaseUrl ?? current.evolutionBaseUrl,
        evolutionApiKey: body.evolutionApiKey ?? current.evolutionApiKey,
        evolutionInstanceName: body.evolutionInstanceName ?? current.evolutionInstanceName,
        evolutionWebhookSecret: body.evolutionWebhookSecret ?? current.evolutionWebhookSecret,
        openAiModel: body.openAiModel ?? current.openAiModel,
        assistantEnabled: body.assistantEnabled ?? current.assistantEnabled,
        assistantScope: body.assistantScope ?? current.assistantScope,
        assistantSystemPrompt: body.assistantSystemPrompt ?? current.assistantSystemPrompt,
        defaultAssigneeUserId: body.defaultAssigneeUserId ?? current.defaultAssigneeUserId,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to save CRM settings" }, { status: 500 });
  }
}

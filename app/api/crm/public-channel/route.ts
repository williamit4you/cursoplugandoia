import { NextResponse } from "next/server";
import { getOrCreateCrmSettings } from "@/lib/crmSettings";
import { buildWhatsAppHref } from "@/lib/crm";

export async function GET() {
  try {
    const settings = await getOrCreateCrmSettings();

    return NextResponse.json({
      whatsappEnabled: settings.whatsappEnabled,
      whatsappDisplayLabel: settings.whatsappDisplayLabel,
      whatsappNumber: settings.whatsappNumber,
      whatsappDefaultMessage: settings.whatsappDefaultMessage,
      whatsappHref: buildWhatsAppHref(settings.whatsappNumber, settings.whatsappDefaultMessage),
    });
  } catch (error) {
    return NextResponse.json(
      {
        whatsappEnabled: false,
        whatsappDisplayLabel: "Falar no WhatsApp",
        whatsappNumber: "",
        whatsappDefaultMessage: "",
        whatsappHref: "https://wa.me/",
      },
      { status: 200 }
    );
  }
}

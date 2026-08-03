import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { getOrCreateCrmSettings } from "@/lib/crmSettings";

function text(value: unknown) {
  return String(value || "").trim();
}

async function main() {
  const settings = await getOrCreateCrmSettings();

  const evolutionBaseUrl = text(process.env.WHATSAPP_PROMOS_EVOLUTION_BASE_URL);
  const evolutionApiKey = text(process.env.WHATSAPP_PROMOS_EVOLUTION_API_KEY);
  const evolutionInstanceName = text(process.env.WHATSAPP_PROMOS_EVOLUTION_INSTANCE_NAME);
  const whatsappNumber = text(process.env.WHATSAPP_PROMOS_WHATSAPP_NUMBER);
  const offersGroupTargetId = text(process.env.WHATSAPP_PROMOS_GROUP_TARGET_ID);
  const offersGroupLabel = text(process.env.WHATSAPP_PROMOS_GROUP_LABEL);
  const offersCronEnabled = ["1", "true", "yes", "on"].includes(text(process.env.WHATSAPP_PROMOS_CRON_ENABLED).toLowerCase());

  const updated = await prisma.crmSettings.update({
    where: { id: settings.id },
    data: {
      whatsappEnabled: true,
      whatsappDisplayLabel: "Falar no WhatsApp",
      whatsappNumber: whatsappNumber || settings.whatsappNumber,
      whatsappDefaultMessage: "Confira as promoções da Compra Esperta Promoções.",
      evolutionEnabled: true,
      evolutionBaseUrl: evolutionBaseUrl || settings.evolutionBaseUrl,
      evolutionApiKey: evolutionApiKey || settings.evolutionApiKey,
      evolutionInstanceName: evolutionInstanceName || settings.evolutionInstanceName,
      offersCronEnabled,
      offersGroupTargetId: offersGroupTargetId || settings.offersGroupTargetId,
      offersGroupLabel: offersGroupLabel || settings.offersGroupLabel,
      offersPublishIntervalMin: 60,
      offersDailyStartHour: 8,
      offersDailyEndHour: 22,
      offersRequireApproval: true,
      offersLastRunAt: null,
      offersNextRunAt: null,
    },
    select: {
      id: true,
      whatsappNumber: true,
      evolutionEnabled: true,
      evolutionBaseUrl: true,
      evolutionInstanceName: true,
      offersCronEnabled: true,
      offersGroupTargetId: true,
      offersGroupLabel: true,
    },
  });

  console.log(JSON.stringify(updated, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import "server-only";

import { generateEngagementIdea } from "@/lib/engagement/generateIdea";
import { ENGAGEMENT_TEMPLATES, type EngagementTemplateType } from "@/lib/engagement/templates";

function randomTemplateType(): EngagementTemplateType {
  const items = ENGAGEMENT_TEMPLATES.map((item) => item.type);
  const index = Math.floor(Math.random() * items.length);
  return items[index] || "INUTIL_ATE_VER";
}

export async function generateEngagementPipelineCopy(params: {
  productTitle?: string;
  productDescription?: string;
  productDetails?: string;
}) {
  const templateType = randomTemplateType();
  const result = await generateEngagementIdea({
    templateType,
    productTitle: params.productTitle,
    productDescription: params.productDescription,
    productDetails: params.productDetails,
    durationHint: "1 a 2 minutos",
  });

  return {
    templateType,
    hook: result.hook,
    script: result.script,
    ctaComment: result.ctaComment,
    onScreenText: result.onScreenText,
    personaName: result.personaName,
  };
}

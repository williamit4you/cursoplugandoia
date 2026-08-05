import { ExternalLink } from "lucide-react";
import { buildCobasiAffiliateHref } from "@/lib/pet-seo/affiliateRules";

export function PetAffiliateCta({ campaign, source = "pet_seo", medium = "content", label = "Conferir produtos e condições atuais" }: { campaign: string; source?: string; medium?: string; label?: string }) {
  return (
    <a href={buildCobasiAffiliateHref({ source, medium, campaign })} rel="sponsored" className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700">
      {label}<ExternalLink className="h-4 w-4" />
    </a>
  );
}


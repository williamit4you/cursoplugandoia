export type AffiliateProgramKind =
  | "PET_LOCAL_SEO"
  | "BABY_FASHION"
  | "HOME_APPLIANCES"
  | "SKINCARE"
  | "SUPPLEMENT"
  | "COLLECTIBLES"
  | "MATTRESSES"
  | "THERMALS"
  | "LIFESTYLE"
  | "FASHION"
  | "PHARMACY";

export type AffiliateProgramSpec = {
  storeSlug: string;
  programCode: string;
  displayName: string;
  heroLabel: string;
  kind: AffiliateProgramKind;
  docsPath: string;
  adminPath: string;
  ctaPath: string;
  rolloutStatus: "pilot-live" | "foundation-ready" | "planned";
  cadenceLabel: string;
  firstBatchLabel: string;
  riskLabel: "low" | "medium" | "high" | "critical";
};

export const AFFILIATE_PROGRAMS: AffiliateProgramSpec[] = [
  {
    storeSlug: "cobasi",
    programCode: "COBASI_PET",
    displayName: "Cobasi",
    heroLabel: "SEO local e categorias pet",
    kind: "PET_LOCAL_SEO",
    docsPath: "docs/specs/cobasi-content-seo/README.md",
    adminPath: "/admin/seo-pet-cobasi",
    ctaPath: "/go/loja/cobasi",
    rolloutStatus: "pilot-live",
    cadenceLabel: "Ate 1 pagina por dia",
    firstBatchLabel: "18 a 24 paginas iniciais",
    riskLabel: "high",
  },
  {
    storeSlug: "brascol",
    programCode: "BRASCOL_BABY",
    displayName: "Brascol",
    heroLabel: "Atacado e varejo infantil",
    kind: "BABY_FASHION",
    docsPath: "docs/specs/affiliate-content-programs/01-projeto-brascol.md",
    adminPath: "/admin/programas-afiliados",
    ctaPath: "/go/loja/brascol",
    rolloutStatus: "foundation-ready",
    cadenceLabel: "3 publicacoes por semana",
    firstBatchLabel: "30 paginas iniciais",
    riskLabel: "medium",
  },
  {
    storeSlug: "electrolux",
    programCode: "ELECTROLUX_HOME",
    displayName: "Electrolux",
    heroLabel: "Portal casa e eletrodomesticos",
    kind: "HOME_APPLIANCES",
    docsPath: "docs/specs/affiliate-content-programs/02-projeto-electrolux.md",
    adminPath: "/admin/programas-afiliados",
    ctaPath: "/go/loja/electrolux",
    rolloutStatus: "foundation-ready",
    cadenceLabel: "Ate 5 publicacoes por semana",
    firstBatchLabel: "36 paginas iniciais",
    riskLabel: "medium",
  },
  {
    storeSlug: "cicatribem",
    programCode: "CICATRIBEM_SKIN",
    displayName: "Cicatribem",
    heroLabel: "Skincare e tratamentos cosmeticos",
    kind: "SKINCARE",
    docsPath: "docs/specs/affiliate-content-programs/04-projeto-cicatribem.md",
    adminPath: "/admin/programas-afiliados",
    ctaPath: "/go/loja/cicatribem",
    rolloutStatus: "planned",
    cadenceLabel: "3 publicacoes por semana",
    firstBatchLabel: "30 paginas iniciais",
    riskLabel: "high",
  },
  {
    storeSlug: "pibe-brasil",
    programCode: "PIBE_CREATINE",
    displayName: "Pibe Brasil",
    heroLabel: "Creatina gummy e performance",
    kind: "SUPPLEMENT",
    docsPath: "docs/specs/affiliate-content-programs/05-projeto-pibe-brasil.md",
    adminPath: "/admin/programas-afiliados",
    ctaPath: "/go/loja/pibe-brasil",
    rolloutStatus: "planned",
    cadenceLabel: "3 publicacoes por semana",
    firstBatchLabel: "20 paginas iniciais",
    riskLabel: "high",
  },
  {
    storeSlug: "funko-brasil",
    programCode: "FUNKO_COLLECT",
    displayName: "Funko Brasil",
    heroLabel: "Colecionaveis, franquias e guias",
    kind: "COLLECTIBLES",
    docsPath: "docs/specs/affiliate-content-programs/06-projeto-funko-brasil.md",
    adminPath: "/admin/programas-afiliados",
    ctaPath: "/go/loja/funko-brasil",
    rolloutStatus: "planned",
    cadenceLabel: "Ate 5 publicacoes por semana",
    firstBatchLabel: "30 paginas iniciais",
    riskLabel: "low",
  },
  {
    storeSlug: "probel",
    programCode: "PROBEL_SLEEP",
    displayName: "Probel",
    heroLabel: "Colchoes, conforto e comparativos",
    kind: "MATTRESSES",
    docsPath: "docs/specs/affiliate-content-programs/07-projeto-probel.md",
    adminPath: "/admin/programas-afiliados",
    ctaPath: "/go/loja/probel",
    rolloutStatus: "planned",
    cadenceLabel: "4 publicacoes por semana",
    firstBatchLabel: "30 paginas iniciais",
    riskLabel: "medium",
  },
  {
    storeSlug: "thermos-brasil",
    programCode: "THERMOS_DRINKWARE",
    displayName: "Thermos Brasil",
    heroLabel: "Termicos, uso e kits",
    kind: "THERMALS",
    docsPath: "docs/specs/affiliate-content-programs/08-projeto-thermos-brasil.md",
    adminPath: "/admin/programas-afiliados",
    ctaPath: "/go/loja/thermos-brasil",
    rolloutStatus: "planned",
    cadenceLabel: "4 publicacoes por semana",
    firstBatchLabel: "30 paginas iniciais",
    riskLabel: "low",
  },
  {
    storeSlug: "escuta-o-veio",
    programCode: "ESCUTA_PRESENTES",
    displayName: "Escuta o Veio",
    heroLabel: "Editorial comercial de presentes",
    kind: "LIFESTYLE",
    docsPath: "docs/specs/affiliate-content-programs/09-projeto-escuta-o-veio.md",
    adminPath: "/admin/programas-afiliados",
    ctaPath: "/go/loja/escuta-o-veio",
    rolloutStatus: "planned",
    cadenceLabel: "4 publicacoes por semana",
    firstBatchLabel: "25 paginas iniciais",
    riskLabel: "medium",
  },
  {
    storeSlug: "glnc-farma",
    programCode: "GLNC_HEALTH",
    displayName: "GLNC Farma",
    heroLabel: "Saude e bem-estar com guardrails",
    kind: "PHARMACY",
    docsPath: "docs/specs/affiliate-content-programs/10-projeto-glnc-farma.md",
    adminPath: "/admin/programas-afiliados",
    ctaPath: "/go/loja/glnc-farma",
    rolloutStatus: "planned",
    cadenceLabel: "3 publicacoes por semana",
    firstBatchLabel: "20 paginas iniciais",
    riskLabel: "high",
  },
  {
    storeSlug: "tng",
    programCode: "TNG_STYLE",
    displayName: "TNG",
    heroLabel: "Editorial de estilo e compra",
    kind: "FASHION",
    docsPath: "docs/specs/affiliate-content-programs/11-projeto-tng.md",
    adminPath: "/admin/programas-afiliados",
    ctaPath: "/go/loja/tng",
    rolloutStatus: "planned",
    cadenceLabel: "4 publicacoes por semana",
    firstBatchLabel: "25 paginas iniciais",
    riskLabel: "low",
  },
  {
    storeSlug: "drogaria-rosario",
    programCode: "ROSARIO_PHARMA",
    displayName: "Drogaria Rosario",
    heroLabel: "Conteudo farmaceutico com compliance",
    kind: "PHARMACY",
    docsPath: "docs/specs/affiliate-content-programs/12-projeto-drogaria-rosario.md",
    adminPath: "/admin/programas-afiliados",
    ctaPath: "/go/loja/drogaria-rosario",
    rolloutStatus: "planned",
    cadenceLabel: "4 publicacoes por semana",
    firstBatchLabel: "30 paginas iniciais",
    riskLabel: "high",
  },
];

export function getAffiliateProgram(storeSlug: string) {
  return AFFILIATE_PROGRAMS.find((program) => program.storeSlug === storeSlug) || null;
}

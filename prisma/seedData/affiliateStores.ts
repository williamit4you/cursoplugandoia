import type { PrismaClient } from "@prisma/client";

type StoreMeta = readonly [name: string, category: string];

const STORE_META: StoreMeta[] = [
  ["Wine21", "Vinhos"],
  ["Youmint", "Suplementos em gummies"],
  ["Rainoah Bem Estar", "Bem-estar"],
  ["Dipua", "Decoração e presentes"],
  ["Artes da Dianinha", "Artesanato e personalizados"],
  ["Arromba Tattoo", "Equipamentos para tatuagem"],
  ["Gotas do Infinictho", "Florais e bem-estar"],
  ["Mix Perfumaria", "Perfumes e beleza"],
  ["Sawary", "Moda jeans"],
  ["Concórdia Informática", "Informática"],
  ["Rigolim", "Cabelo e penteados"],
  ["Casa Lar Shop", "Casa e utilidades"],
  ["Macrophytus", "Suplementos e naturais"],
  ["Trydal", "Catálogo geral"],
  ["Grupo Strike", "Catálogo geral"],
  ["Goper Fit", "Fitness"],
  ["Camiseteria Tattoos", "Moda temática"],
  ["Forever Moments", "Presentes"],
  ["Serrano Chocolates", "Chocolates e presentes"],
  ["Carmen Lee", "Moda e acessórios"],
  ["Casa China", "Casa, utilidades e variedades"],
  ["Je Peux", "Moda e acessórios"],
  ["Foreli Berloques", "Joias e berloques"],
  ["Fit House", "Fitness e bem-estar"],
  ["Giovanna Cais", "Moda e acessórios"],
  ["Felice Cafés", "Cafés especiais"],
  ["Ada Tina", "Dermocosméticos"],
  ["Editora Prazer da Palavra", "Livros"],
  ["Troia Hair", "Cuidados capilares"],
  ["Ri Happy", "Brinquedos"],
  ["Lancôme", "Beleza e perfumaria"],
  ["Drogasmil", "Farmácia"],
  ["Candide", "Brinquedos"],
  ["Relaxmedic", "Conforto e bem-estar"],
  ["Surf Trip", "Moda surf"],
  ["Top Therm", "Suplementos"],
  ["Payot", "Maquiagem e skincare"],
  ["Forever Liss", "Cuidados capilares"],
  ["GA.MA Italy", "Aparelhos para cabelo"],
  ["Fossil", "Relógios e acessórios"],
  ["Caedu", "Moda"],
  ["Jequiti", "Beleza e perfumaria"],
  ["Tok&Stok", "Móveis e decoração"],
  ["Seculus", "Relógios"],
  ["Mondaine", "Relógios"],
  ["Coffee Mais", "Cafés especiais"],
  ["Amakha Paris", "Cosméticos e perfumes"],
  ["Farmácia Indiana", "Farmácia"],
  ["Oimu", "Moda infantil"],
  ["Nido Infantil", "Moda infantil"],
  ["Multi", "Eletrônicos e casa"],
  ["TodoVino", "Vinhos"],
  ["Tropical Especiarias", "Temperos e alimentos"],
  ["Editora 4 Ventos", "Livros"],
  ["Natus Farma", "Bem-estar e cuidados"],
  ["Colormaq", "Eletrodomésticos"],
  ["DJI Brasil", "Drones e câmeras"],
  ["Mizuno", "Corrida e esporte"],
  ["Salon Line", "Cabelos"],
  ["Pague Menos", "Farmácia"],
  ["Olympikus", "Corrida e esporte"],
  ["Pink Dream", "Pijamas e casa"],
  ["Ferramentas Kennedy", "Ferramentas"],
  ["Under Armour", "Esporte"],
  ["Super Pro Atacado", "Beleza profissional"],
  ["Any Any", "Pijamas e lingerie"],
  ["Bagaggio", "Viagem"],
  ["Maxfem", "Cuidados femininos"],
  ["Drogarias Tamoio", "Farmácia"],
  ["Assist Card", "Seguro viagem"],
  ["Drogaria Rosário", "Farmácia"],
  ["TNG", "Moda masculina"],
  ["GLNC Farma", "Saúde e bem-estar"],
  ["Escuta o Véio", "Moda e presentes"],
  ["Thermos Brasil", "Térmicos"],
  ["Electrolux", "Eletrodomésticos"],
  ["Probel", "Colchões"],
  ["Funko Brasil", "Colecionáveis"],
  ["Cobasi", "Pet"],
  ["Pibe Brasil", "Creatina gummy"],
  ["Cicatribem", "Skincare"],
  ["Brascol", "Moda bebê e infantil"],
  ["Cristais Tavares", "Decoração em cristal"],
];

const AFFILIATE_URLS = `
https://www.wine21.com.br?parceiro=551&am=willianbarata
https://www.youmint.com.br?parceiro=9921&am=willianbarata
https://loja.rainoah.com.br?parceiro=3245&am=willianbarata
https://www.dipua.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.artesdadianinha.com.br?parceiro=12077&am=willianbarata
https://www.arrombatattoo.com.br?parceiro=8435&am=willianbarata
https://www.gotasdoinfinictho.com.br?parceiro=11003&am=willianbarata
https://www.mixperfumaria.com.br?parceiro=9277&am=willianbarata
https://www.sawary.com?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.concordia.inf.br?parceiro=9837&am=willianbarata
https://www.rigolim.com.br?parceiro=9710&am=willianbarata
https://www.casalarshop.com.br?parceiro=8835&am=willianbarata
https://www.macrophytus.com.br?parceiro=10479&am=willianbarata
https://trydal-1185256.commercesuite.com.br?parceiro=6121&am=willianbarata
https://www.grupostrike.com.br?parceiro=&am=willianbarata
https://loja.goper.fit?parceiro=9578&am=willianbarata
https://www.camiseteriatattoos.com?parceiro=7288&am=willianbarata
https://lojaforevermoments.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.serranochocolates.com.br?parceiro=6455&am=willianbarata
https://www.carmenlee.com.br?parceiro=9078&am=willianbarata
https://www.nacasachinatem.com.br?parceiro=10024&am=willianbarata
https://www.lojajepeux.com.br?parceiro=&am=willianbarata
https://www.foreliberloques.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.fithouse.com.br?parceiro=12881&am=willianbarata
https://www.giovannacais.com.br?parceiro=11373&am=willianbarata
https://www.felicecafes.com.br?parceiro=7109&am=willianbarata
https://www.adatina.com/?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.editoraprazerdapalavra.com.br?parceiro=&am=willianbarata
https://www.troiahaircosmeticos.com.br?parceiro=11195&am=willianbarata
https://www.rihappy.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.lancome.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.drogasmil.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.candide.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://relaxmedic.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.surftrip.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.toptherm.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.lojapayot.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.foreverliss.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.gamaitaly.com.br/?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.fossil.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.caedu.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.jequiti.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.tokstok.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.seculus.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.mondaine.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://coffeemais.com?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.amakhaparis.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.farmaciaindiana.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://oimu.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://nidoinfantil.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.multilaser.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.todovino.com.br?sc=22&utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://tropicalespeciarias.com.br/?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://editora4ventos.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.natusfarma.com.br/?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://loja.colormaq.com.br/?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.lojadji.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.mizuno.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.salonline.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.paguemenos.com.br?utm_source=mais&utm_medium=minhalojapgm&utm_campaign=willianbarata
https://www.olympikus.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.pinkdream.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.ferramentaskennedy.com.br/?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.underarmour.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.superproatacado.com.br/?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.anyany.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.bagaggio.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://maxfem.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.drogariastamoio.com.br/?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.assistcard.com/br/b2c/afiliados?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.drogariarosario.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.tng.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.glncfarma.com/?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.escutaoveio.com/?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.thermosbrasil.com.br?parceiro=12410&am=willianbarata
https://loja.electrolux.com.br/?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.probel.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.funko.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://minhaloja.cobasi.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://pibebrasil.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://cicatribem.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://brascol.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
https://www.cristaistavares.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata
`
  .trim()
  .split(/\r?\n/)
  .map((value) => value.trim())
  .filter(Boolean);

const BLOCKED = new Map([
  ["wine21", "ALCOHOL"],
  ["todovino", "ALCOHOL"],
  ["arromba-tattoo", "BODY_PROCEDURE"],
]);

const FEATURED = new Set([
  "electrolux",
  "cobasi",
  "ri-happy",
  "mizuno",
  "olympikus",
  "tok-stok",
  "bagaggio",
  "funko-brasil",
  "salon-line",
  "thermos-brasil",
  "colormaq",
  "dji-brasil",
]);

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function baseUrl(affiliateUrl: string) {
  const url = new URL(affiliateUrl);
  return `${url.protocol}//${url.host}${url.pathname === "/" ? "" : url.pathname}`;
}

export async function seedAffiliateStores(prisma: PrismaClient) {
  if (STORE_META.length !== AFFILIATE_URLS.length) {
    throw new Error(`Catálogo de afiliados inconsistente: ${STORE_META.length} lojas e ${AFFILIATE_URLS.length} URLs.`);
  }

  const result = { active: 0, needsFix: 0, blocked: 0 };

  for (let index = 0; index < STORE_META.length; index += 1) {
    const [name, category] = STORE_META[index];
    const affiliateUrl = AFFILIATE_URLS[index];
    const parsed = new URL(affiliateUrl);
    const slug = slugify(name);
    const incomplete = /[?&]parceiro=(?:&|$)/i.test(affiliateUrl);
    const complianceClass = BLOCKED.get(slug) || (/farm|suplement|saúde|bem-estar|skincare|dermo|cuidado/i.test(category) ? "SENSITIVE_HEALTH" : "STANDARD");
    const status = BLOCKED.has(slug) ? "BLOCKED" : incomplete ? "NEEDS_FIX" : "ACTIVE";

    if (status === "ACTIVE") result.active += 1;
    else if (status === "NEEDS_FIX") result.needsFix += 1;
    else result.blocked += 1;

    const defaultCopy = `Conheça a seleção de ${category.toLowerCase()} da ${name} e confira as condições atualizadas diretamente na loja.`;
    const create = {
      name,
      slug,
      category,
      defaultCopy,
      baseUrl: baseUrl(affiliateUrl),
      affiliateUrl,
      domain: parsed.hostname,
      status,
      complianceClass,
      featured: FEATURED.has(slug),
      sortOrder: index + 1,
    };

    await prisma.affiliateStore.upsert({
      where: { slug },
      create,
      update: {
        name,
        category,
        baseUrl: create.baseUrl,
        affiliateUrl,
        domain: parsed.hostname,
        status,
        complianceClass,
        featured: create.featured,
        sortOrder: create.sortOrder,
      },
    });
  }

  return result;
}

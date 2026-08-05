export type PetLocationSeed = { city: string; state: string; slug: string };

export const PET_LOCATION_SEEDS: PetLocationSeed[] = [
  ["Palmas", "TO", "palmas-to"], ["Maceió", "AL", "maceio-al"],
  ["Feira de Santana", "BA", "feira-de-santana-ba"], ["Lauro de Freitas", "BA", "lauro-de-freitas-ba"], ["Salvador", "BA", "salvador-ba"],
  ["Eusébio", "CE", "eusebio-ce"], ["Fortaleza", "CE", "fortaleza-ce"], ["Maracanaú", "CE", "maracanau-ce"],
  ["Brasília", "DF", "brasilia-df"], ["Planaltina", "DF", "planaltina-df"], ["Vila Velha", "ES", "vila-velha-es"], ["Goiânia", "GO", "goiania-go"],
  ["Belo Horizonte", "MG", "belo-horizonte-mg"], ["Juiz de Fora", "MG", "juiz-de-fora-mg"], ["Uberaba", "MG", "uberaba-mg"], ["Uberlândia", "MG", "uberlandia-mg"],
  ["Campo Grande", "MS", "campo-grande-ms"], ["Cuiabá", "MT", "cuiaba-mt"], ["Várzea Grande", "MT", "varzea-grande-mt"], ["Belém", "PA", "belem-pa"],
  ["Cabedelo", "PB", "cabedelo-pb"], ["João Pessoa", "PB", "joao-pessoa-pb"], ["Jaboatão dos Guararapes", "PE", "jaboatao-dos-guararapes-pe"], ["Recife", "PE", "recife-pe"],
  ["Cascavel", "PR", "cascavel-pr"], ["Curitiba", "PR", "curitiba-pr"], ["Londrina", "PR", "londrina-pr"], ["Maringá", "PR", "maringa-pr"], ["Pinhais", "PR", "pinhais-pr"], ["Ponta Grossa", "PR", "ponta-grossa-pr"], ["São José dos Pinhais", "PR", "sao-jose-dos-pinhais-pr"],
  ["Niterói", "RJ", "niteroi-rj"], ["Rio de Janeiro", "RJ", "rio-de-janeiro-rj"], ["Natal", "RN", "natal-rn"],
  ["Canoas", "RS", "canoas-rs"], ["Caxias do Sul", "RS", "caxias-do-sul-rs"], ["Novo Hamburgo", "RS", "novo-hamburgo-rs"], ["Passo Fundo", "RS", "passo-fundo-rs"], ["Pelotas", "RS", "pelotas-rs"], ["Porto Alegre", "RS", "porto-alegre-rs"], ["Viamão", "RS", "viamao-rs"],
  ["Blumenau", "SC", "blumenau-sc"], ["Criciúma", "SC", "criciuma-sc"], ["Florianópolis", "SC", "florianopolis-sc"], ["Itajaí", "SC", "itajai-sc"], ["Joinville", "SC", "joinville-sc"], ["São José", "SC", "sao-jose-sc"],
  ["Aracaju", "SE", "aracaju-se"], ["Americana", "SP", "americana-sp"], ["Araçatuba", "SP", "aracatuba-sp"], ["Araraquara", "SP", "araraquara-sp"], ["Atibaia", "SP", "atibaia-sp"], ["Barretos", "SP", "barretos-sp"], ["Barueri", "SP", "barueri-sp"], ["Bauru", "SP", "bauru-sp"], ["Bertioga", "SP", "bertioga-sp"], ["Birigui", "SP", "birigui-sp"], ["Botucatu", "SP", "botucatu-sp"], ["Bragança Paulista", "SP", "braganca-paulista-sp"], ["Campinas", "SP", "campinas-sp"], ["Carapicuíba", "SP", "carapicuiba-sp"], ["Cotia", "SP", "cotia-sp"], ["Diadema", "SP", "diadema-sp"], ["Embu das Artes", "SP", "embu-das-artes-sp"], ["Franca", "SP", "franca-sp"], ["Guarujá", "SP", "guaruja-sp"], ["Guarulhos", "SP", "guarulhos-sp"], ["Indaiatuba", "SP", "indaiatuba-sp"], ["Itaquaquecetuba", "SP", "itaquaquecetuba-sp"], ["Jacareí", "SP", "jacarei-sp"], ["Jandira", "SP", "jandira-sp"], ["Jaú", "SP", "jau-sp"], ["Jundiaí", "SP", "jundiai-sp"], ["Limeira", "SP", "limeira-sp"], ["Marília", "SP", "marilia-sp"], ["Osasco", "SP", "osasco-sp"], ["Paulínia", "SP", "paulinia-sp"], ["Piracicaba", "SP", "piracicaba-sp"], ["Praia Grande", "SP", "praia-grande-sp"], ["Presidente Prudente", "SP", "presidente-prudente-sp"], ["Ribeirão Preto", "SP", "ribeirao-preto-sp"], ["Salto", "SP", "salto-sp"], ["Santa Bárbara d’Oeste", "SP", "santa-barbara-doeste-sp"], ["Santo André", "SP", "santo-andre-sp"], ["Santos", "SP", "santos-sp"], ["São Bernardo do Campo", "SP", "sao-bernardo-do-campo-sp"], ["São Caetano do Sul", "SP", "sao-caetano-do-sul-sp"], ["São Carlos", "SP", "sao-carlos-sp"], ["São José do Rio Preto", "SP", "sao-jose-do-rio-preto-sp"], ["São José dos Campos", "SP", "sao-jose-dos-campos-sp"], ["São Paulo", "SP", "sao-paulo-sp"], ["São Vicente", "SP", "sao-vicente-sp"], ["Sorocaba", "SP", "sorocaba-sp"], ["Sumaré", "SP", "sumare-sp"], ["Taubaté", "SP", "taubate-sp"], ["Valinhos", "SP", "valinhos-sp"], ["Vinhedo", "SP", "vinhedo-sp"],
].map(([city, state, slug]) => ({ city, state, slug }));

export type PetContentSeed = {
  type: "HUB" | "CATEGORY" | "GUIDE" | "COMPARISON" | "LOCAL";
  path: string;
  title: string;
  primaryKeyword: string;
  searchIntent: string;
  internalLinks: string[];
  queued?: boolean;
  locationSlug?: string;
};

export const PET_CONTENT_SEEDS: PetContentSeed[] = [
  { type: "HUB", path: "pets", title: "Guia de produtos e cuidados para pets", primaryKeyword: "produtos para pets", searchIntent: "informacional", internalLinks: ["/pets/cachorros", "/pets/gatos"], queued: true },
  { type: "HUB", path: "pet-shop", title: "Onde comprar produtos pet perto de você", primaryKeyword: "onde comprar produtos pet", searchIntent: "local", internalLinks: ["/pets", "/pet-shop/sao-paulo-sp", "/pet-shop/campinas-sp", "/pet-shop/curitiba-pr"], queued: true },
  { type: "HUB", path: "pets/cachorros", title: "Guia completo para cachorros", primaryKeyword: "produtos para cachorro", searchIntent: "informacional", internalLinks: ["/pets", "/pets/cachorros/racao", "/pets/cachorros/brinquedos"], queued: true },
  { type: "HUB", path: "pets/gatos", title: "Guia completo para gatos", primaryKeyword: "produtos para gatos", searchIntent: "informacional", internalLinks: ["/pets", "/pets/gatos/racao", "/pets/gatos/areia"], queued: true },
  { type: "CATEGORY", path: "pets/cachorros/racao", title: "Ração para cachorro: como escolher", primaryKeyword: "ração para cachorro", searchIntent: "comercial", internalLinks: ["/pets/cachorros", "/pets/guias/racao-para-cachorro-filhote"], queued: true },
  { type: "CATEGORY", path: "pets/gatos/racao", title: "Ração para gato: critérios de escolha", primaryKeyword: "ração para gato", searchIntent: "comercial", internalLinks: ["/pets/gatos", "/pets/guias/como-escolher-racao-para-gato"], queued: true },
  { type: "CATEGORY", path: "pets/gatos/areia", title: "Areia para gato: tipos e diferenças", primaryKeyword: "areia para gato", searchIntent: "comercial", internalLinks: ["/pets/gatos", "/pets/guias/como-escolher-areia-para-gato"], queued: true },
  { type: "CATEGORY", path: "pets/cachorros/brinquedos", title: "Brinquedos para cachorro: guia por perfil", primaryKeyword: "brinquedos para cachorro", searchIntent: "comercial", internalLinks: ["/pets/cachorros"], queued: true },
  { type: "CATEGORY", path: "pets/gatos/arranhadores", title: "Arranhadores para gato: formatos e escolha", primaryKeyword: "arranhador para gato", searchIntent: "comercial", internalLinks: ["/pets/gatos"], queued: true },
  { type: "CATEGORY", path: "pets/caixas-de-transporte", title: "Caixas de transporte para pets", primaryKeyword: "caixa de transporte para pet", searchIntent: "comercial", internalLinks: ["/pets", "/pets/guias/como-escolher-caixa-de-transporte"], queued: true },
  { type: "GUIDE", path: "pets/guias/racao-para-cachorro-filhote", title: "Como escolher ração para cachorro filhote", primaryKeyword: "ração para cachorro filhote", searchIntent: "comercial", internalLinks: ["/pets/cachorros", "/pets/cachorros/racao"], queued: true },
  { type: "GUIDE", path: "pets/guias/racao-para-cachorro-idoso", title: "Ração para cachorro idoso: o que avaliar", primaryKeyword: "ração para cachorro idoso", searchIntent: "comercial", internalLinks: ["/pets/cachorros", "/pets/cachorros/racao"], queued: true },
  { type: "GUIDE", path: "pets/guias/racao-premium-ou-super-premium", title: "Ração premium ou super premium: diferenças", primaryKeyword: "ração premium ou super premium", searchIntent: "comparação", internalLinks: ["/pets/cachorros/racao", "/pets/gatos/racao"], queued: true },
  { type: "GUIDE", path: "pets/guias/como-escolher-areia-para-gato", title: "Como escolher areia para gato", primaryKeyword: "como escolher areia para gato", searchIntent: "comercial", internalLinks: ["/pets/gatos", "/pets/gatos/areia"], queued: true },
  { type: "GUIDE", path: "pets/guias/como-escolher-caixa-de-transporte", title: "Como escolher caixa de transporte para pet", primaryKeyword: "como escolher caixa de transporte", searchIntent: "comercial", internalLinks: ["/pets", "/pets/caixas-de-transporte"], queued: true },
  { type: "GUIDE", path: "pets/guias/como-escolher-fonte-de-agua-para-gatos", title: "Como escolher fonte de água para gatos", primaryKeyword: "fonte de água para gatos", searchIntent: "comercial", internalLinks: ["/pets/gatos"], queued: true },
  { type: "GUIDE", path: "pets/guias/como-escolher-racao-para-gato", title: "Como escolher ração para gato por fase de vida", primaryKeyword: "como escolher ração para gato", searchIntent: "comercial", internalLinks: ["/pets/gatos", "/pets/gatos/racao"], queued: true },
  { type: "COMPARISON", path: "pets/comparativos/premier-ou-royal-canin", title: "Premier ou Royal Canin: diferenças para comparar", primaryKeyword: "Premier ou Royal Canin", searchIntent: "comparação", internalLinks: ["/pets/cachorros/racao", "/pets/gatos/racao"], queued: true },
  { type: "COMPARISON", path: "pets/comparativos/golden-ou-granplus", title: "Golden ou GranPlus: critérios para comparar", primaryKeyword: "Golden ou GranPlus", searchIntent: "comparação", internalLinks: ["/pets/cachorros/racao", "/pets/gatos/racao"], queued: true },
  { type: "COMPARISON", path: "pets/comparativos/pipicat-ou-viva-verde", title: "Pipicat ou Viva Verde: diferenças entre as areias", primaryKeyword: "Pipicat ou Viva Verde", searchIntent: "comparação", internalLinks: ["/pets/gatos/areia"], queued: true },
  { type: "LOCAL", path: "pet-shop/sao-paulo-sp", title: "Onde comprar produtos pet em São Paulo", primaryKeyword: "pet shop em São Paulo", searchIntent: "local", internalLinks: ["/pets", "/pets/cachorros/racao", "/pets/gatos/racao"], locationSlug: "sao-paulo-sp" },
  { type: "LOCAL", path: "pet-shop/campinas-sp", title: "Onde comprar produtos pet em Campinas", primaryKeyword: "pet shop em Campinas", searchIntent: "local", internalLinks: ["/pets", "/pets/cachorros/racao", "/pets/gatos/areia"], locationSlug: "campinas-sp" },
  { type: "LOCAL", path: "pet-shop/curitiba-pr", title: "Onde comprar produtos pet em Curitiba", primaryKeyword: "pet shop em Curitiba", searchIntent: "local", internalLinks: ["/pets", "/pets/cachorros/racao", "/pets/gatos/racao"], locationSlug: "curitiba-pr" },
  { type: "LOCAL", path: "pet-shop/porto-alegre-rs", title: "Onde comprar produtos pet em Porto Alegre", primaryKeyword: "pet shop em Porto Alegre", searchIntent: "local", internalLinks: ["/pets", "/pets/cachorros/racao", "/pets/gatos/areia"], locationSlug: "porto-alegre-rs" },
  { type: "LOCAL", path: "pet-shop/belo-horizonte-mg", title: "Onde comprar produtos pet em Belo Horizonte", primaryKeyword: "pet shop em Belo Horizonte", searchIntent: "local", internalLinks: ["/pets", "/pets/cachorros/racao", "/pets/gatos/racao"], locationSlug: "belo-horizonte-mg" },
  { type: "LOCAL", path: "pet-shop/recife-pe", title: "Onde comprar produtos pet em Recife", primaryKeyword: "pet shop em Recife", searchIntent: "local", internalLinks: ["/pets", "/pets/cachorros/racao", "/pets/gatos/areia"], locationSlug: "recife-pe" },
];

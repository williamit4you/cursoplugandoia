// Canais conhecidos do YouTube BR por nicho
// Formato: { handle, category (slug) }
// O seed resolverá os channel IDs via API ou usará mock data

export const YT_SEED_CHANNELS = [
  // ── Entretenimento / Humor ──
  { handle: "@Whindersson", category: "entretenimento-humor" },
  { handle: "@FelipeNeto", category: "entretenimento-humor" },
  { handle: "@CanalCanalha", category: "entretenimento-humor" },
  { handle: "@Porta_dos_Fundos", category: "entretenimento-humor" },
  { handle: "@LuccasNeto", category: "entretenimento-humor" },
  { handle: "@CanalKondZilla", category: "entretenimento-humor" },
  { handle: "@Gato_Galactico", category: "entretenimento-humor" },
  { handle: "@MANUGavassi", category: "entretenimento-humor" },
  { handle: "@CoisaDeNerd", category: "entretenimento-humor" },
  { handle: "@Desimpedidos", category: "entretenimento-humor" },

  // ── Games ──
  { handle: "@AuthenticGames", category: "games" },
  { handle: "@RezendeEvil", category: "games" },
  { handle: "@TazerCraft", category: "games" },
  { handle: "@MrPoladoful", category: "games" },
  { handle: "@CronosPizzagg", category: "games" },
  { handle: "@Fsjal", category: "games" },
  { handle: "@loud_coringa", category: "games" },
  { handle: "@Alanzoka", category: "games" },
  { handle: "@gaaborflips", category: "games" },
  { handle: "@EduKof", category: "games" },

  // ── Música ──
  { handle: "@Kondzilla", category: "musica" },
  { handle: "@Anitta", category: "musica" },
  { handle: "@GusttavoLima", category: "musica" },
  { handle: "@MariaMaria", category: "musica" },
  { handle: "@HenriqueeJuliano", category: "musica" },
  { handle: "@JorgeeMateus", category: "musica" },
  { handle: "@zabornaval", category: "musica" },
  { handle: "@LuanSantana", category: "musica" },
  { handle: "@MaisaOficial", category: "musica" },
  { handle: "@KevinOChris", category: "musica" },

  // ── Futebol / Esportes ──
  { handle: "@CazeTVOficial", category: "futebol-esportes" },
  { handle: "@canalfrfrr", category: "futebol-esportes" },
  { handle: "@ENTRAmaisUM", category: "futebol-esportes" },
  { handle: "@FutParana", category: "futebol-esportes" },
  { handle: "@FutGol1000", category: "futebol-esportes" },
  { handle: "@futmais", category: "futebol-esportes" },
  { handle: "@NossoFutebol", category: "futebol-esportes" },
  { handle: "@TNTSportsBrasil", category: "futebol-esportes" },
  { handle: "@espabordo", category: "futebol-esportes" },
  { handle: "@FlaDois", category: "futebol-esportes" },

  // ── Política / Atualidades ──
  { handle: "@brasilparalelo", category: "politica-atualidades" },
  { handle: "@NicolasFerreira", category: "politica-atualidades" },
  { handle: "@cortesdoflow", category: "politica-atualidades" },
  { handle: "@UOL", category: "politica-atualidades" },
  { handle: "@BBCNewsBrasil", category: "politica-atualidades" },
  { handle: "@Meteoro", category: "politica-atualidades" },
  { handle: "@ICLNoticiasOficial", category: "politica-atualidades" },
  { handle: "@JovemPanNews", category: "politica-atualidades" },
  { handle: "@CNN", category: "politica-atualidades" },
  { handle: "@RedeTV", category: "politica-atualidades" },

  // ── Finanças / Investimentos ──
  { handle: "@maborges", category: "financas-investimentos" },
  { handle: "@PrimoRico", category: "financas-investimentos" },
  { handle: "@NathFinancas", category: "financas-investimentos" },
  { handle: "@economista_sincero", category: "financas-investimentos" },
  { handle: "@InvestidorSardinha", category: "financas-investimentos" },
  { handle: "@osparceiros", category: "financas-investimentos" },
  { handle: "@GustavoSegalla", category: "financas-investimentos" },
  { handle: "@raulsena", category: "financas-investimentos" },
  { handle: "@BrunoPerini", category: "financas-investimentos" },
  { handle: "@MePoupe", category: "financas-investimentos" },

  // ── Tecnologia / IA ──
  { handle: "@Canaltech", category: "tecnologia-ia" },
  { handle: "@Tecmundo", category: "tecnologia-ia" },
  { handle: "@FilipeDeschamps", category: "tecnologia-ia" },
  { handle: "@ManualDoMundo", category: "tecnologia-ia" },
  { handle: "@aaboracodar", category: "tecnologia-ia" },
  { handle: "@Akitando", category: "tecnologia-ia" },
  { handle: "@RafaelProcopio", category: "tecnologia-ia" },
  { handle: "@CursoemVideo", category: "tecnologia-ia" },
  { handle: "@LHtech", category: "tecnologia-ia" },
  { handle: "@oinovaWhipbr", category: "tecnologia-ia" },

  // ── Educação / Aulas ──
  { handle: "@professorferretto", category: "educacao-aulas" },
  { handle: "@Stoodi", category: "educacao-aulas" },
  { handle: "@descomplica", category: "educacao-aulas" },
  { handle: "@CursoemVideo", category: "educacao-aulas" },
  { handle: "@KhanAcademy", category: "educacao-aulas" },
  { handle: "@ProfMatheusMaia", category: "educacao-aulas" },
  { handle: "@biologiatotal", category: "educacao-aulas" },
  { handle: "@ProfessorNoslen", category: "educacao-aulas" },
  { handle: "@SeEstudaOficial", category: "educacao-aulas" },
  { handle: "@MeSalva", category: "educacao-aulas" },

  // ── Curiosidades ──
  { handle: "@CanalNostalgia", category: "curiosidades" },
  { handle: "@Fatos_Desconhecidos", category: "curiosidades" },
  { handle: "@IgorSaringer", category: "curiosidades" },
  { handle: "@Meteoro", category: "curiosidades" },
  { handle: "@Nerdologia", category: "curiosidades" },
  { handle: "@SpaceToday", category: "curiosidades" },
  { handle: "@mundodesconhecido", category: "curiosidades" },
  { handle: "@maborges", category: "curiosidades" },
  { handle: "@MilGrau", category: "curiosidades" },
  { handle: "@CienciaTodoDia", category: "curiosidades" },

  // ── Podcast / Cortes ──
  { handle: "@FlowPodcast", category: "podcast-cortes" },
  { handle: "@podabordo", category: "podcast-cortes" },
  { handle: "@podpah", category: "podcast-cortes" },
  { handle: "@InteligenciaLtda", category: "podcast-cortes" },
  { handle: "@venha_ver_tv", category: "podcast-cortes" },
  { handle: "@JoelJota", category: "podcast-cortes" },
  { handle: "@LucasFelpi", category: "podcast-cortes" },
  { handle: "@podcastdenise", category: "podcast-cortes" },
  { handle: "@cortesdopodpah", category: "podcast-cortes" },
  { handle: "@ticaracaticast", category: "podcast-cortes" },
];

type InternalCategoryLike = {
  id: string;
  name: string;
  slug: string;
};

export type YoutubeVideoCategoryOption = {
  id: string;
  label: string;
};

export const YOUTUBE_VIDEO_CATEGORY_OPTIONS: YoutubeVideoCategoryOption[] = [
  { id: "1", label: "Filmes e animação" },
  { id: "2", label: "Automóveis e veículos" },
  { id: "10", label: "Música" },
  { id: "15", label: "Animais e pets" },
  { id: "17", label: "Esportes" },
  { id: "19", label: "Viagens e eventos" },
  { id: "20", label: "Games" },
  { id: "22", label: "Pessoas e blogs" },
  { id: "23", label: "Comédia" },
  { id: "24", label: "Entretenimento" },
  { id: "25", label: "Notícias e política" },
  { id: "26", label: "Como fazer e estilo" },
  { id: "27", label: "Educação" },
  { id: "28", label: "Ciência e tecnologia" },
  { id: "29", label: "Organizações sem fins lucrativos e ativismo" },
];

const YOUTUBE_CATEGORY_LABEL_BY_ID = new Map(
  YOUTUBE_VIDEO_CATEGORY_OPTIONS.map((option) => [option.id, option.label])
);

const INTERNAL_TO_YOUTUBE_CATEGORY_ID_BY_SLUG: Record<string, string> = {
  "entretenimento-humor": "24",
  games: "20",
  musica: "10",
  "futebol-esportes": "17",
  "politica-atualidades": "25",
  "financas-investimentos": "24",
  "tecnologia-ia": "28",
  "educacao-aulas": "27",
  curiosidades: "27",
  "podcast-cortes": "22",
  "lifestyle-vlog": "22",
  "beleza-moda": "26",
  "saude-fitness": "26",
  "receitas-culinaria": "26",
  motivacional: "22",
  empreendedorismo: "24",
  "review-produtos": "28",
  infantil: "24",
  "religiao-gospel": "29",
  "misterio-terror": "24",
  "cinema-series-anime": "1",
  "automoveis-motos": "2",
  "viagens-turismo": "19",
  relacionamento: "22",
  "asmr-relaxamento": "24",
  "animais-pets": "15",
  "historia-documentarios": "27",
  diy: "26",
  "memes-shorts": "23",
  "luxo-lifestyle": "22",
};

export function resolveYoutubeCategoryFromInternalCategory(
  category: InternalCategoryLike
) {
  const youtubeCategoryId =
    INTERNAL_TO_YOUTUBE_CATEGORY_ID_BY_SLUG[category.slug] || "24";

  return {
    youtubeCategoryId,
    youtubeCategoryLabel:
      YOUTUBE_CATEGORY_LABEL_BY_ID.get(youtubeCategoryId) || "Entretenimento",
  };
}

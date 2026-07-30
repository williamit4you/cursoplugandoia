export type AffiliateStoreSeoInput = {
  name: string;
  slug: string;
  category: string;
  defaultCopy: string;
};

export type StoreArticleTopic = {
  slug: string;
  shortLabel: string;
  intent: string;
};

export type StoreArticleContent = {
  topic: StoreArticleTopic;
  title: string;
  description: string;
  intro: string;
  sections: Array<{
    title: string;
    paragraphs: string[];
    bullets?: string[];
  }>;
  faq: Array<{ question: string; answer: string }>;
};

export const STORE_ARTICLE_TOPICS: StoreArticleTopic[] = [
  { slug: "guia-de-compras", shortLabel: "Guia de compras", intent: "Entender a categoria e planejar uma compra melhor" },
  { slug: "como-escolher", shortLabel: "Como escolher", intent: "Comparar critérios antes de decidir" },
  { slug: "ideias-e-inspiracoes", shortLabel: "Ideias e inspirações", intent: "Descobrir usos, combinações e possibilidades" },
  { slug: "antes-de-comprar", shortLabel: "Antes de comprar", intent: "Evitar erros e conferir detalhes importantes" },
  { slug: "ofertas-e-novidades", shortLabel: "Ofertas e novidades", intent: "Acompanhar condições reais sem cair em urgência artificial" },
];

type CategoryProfile = {
  criteria: string[];
  practicalTip: string;
  comparisonTip: string;
  caution: string;
};

function profileFor(category: string): CategoryProfile {
  const value = category.toLowerCase();
  if (/moda|jeans|pijama|lingerie|roupa|infantil/.test(value)) {
    return {
      criteria: ["tabela de medidas", "material e composição do tecido", "caimento esperado", "instruções de lavagem", "política de troca"],
      practicalTip: "Compare suas medidas com a tabela da peça, em vez de confiar apenas no tamanho que você costuma usar.",
      comparisonTip: "Considere tecido, acabamento, versatilidade e frequência de uso — não somente a aparência da foto.",
      caution: "Cores e proporções podem variar entre telas e fotos. Confira medidas, composição e condições de troca.",
    };
  }
  if (/beleza|cabelo|capilar|skincare|cosm|perfume|dermo|cuidado|farma|suplement|gummy|bem-estar|florais/.test(value)) {
    return {
      criteria: ["composição e ingredientes", "perfil de uso indicado", "quantidade ou volume", "modo de uso informado", "restrições e advertências"],
      practicalTip: "Leia a composição e as orientações oficiais, especialmente se você tem sensibilidade, alergias ou utiliza outros produtos.",
      comparisonTip: "Compare finalidade, composição, rendimento e adequação à sua rotina; embalagens parecidas podem atender necessidades diferentes.",
      caution: "Conteúdo comercial não substitui orientação profissional. Não use promessas de cura, resultado garantido ou transformação corporal como critério.",
    };
  }
  if (/eletr|informática|drone|câmera|eletrodomést|aparelho/.test(value)) {
    return {
      criteria: ["voltagem e consumo", "dimensões e espaço disponível", "compatibilidade", "garantia", "assistência técnica"],
      practicalTip: "Confirme medidas, voltagem e conexões antes de comprar; esses três pontos evitam grande parte das trocas.",
      comparisonTip: "Compare especificações que mudam o uso real, como capacidade, potência, autonomia, ruído e suporte.",
      caution: "Não presuma compatibilidade pelo nome do produto. Consulte a ficha técnica e os requisitos do fabricante.",
    };
  }
  if (/casa|decoração|móveis|colch|cristal|térmico|utilidades/.test(value)) {
    return {
      criteria: ["medidas do ambiente", "material", "montagem ou instalação", "limpeza e manutenção", "prazo e modalidade de entrega"],
      practicalTip: "Meça o espaço e registre largura, altura, profundidade e acessos antes de abrir a página da loja.",
      comparisonTip: "Avalie durabilidade, manutenção, facilidade de montagem e como o item conversa com o que você já possui.",
      caution: "Frete e entrega podem mudar bastante conforme dimensões e CEP. Confira o custo total antes de concluir.",
    };
  }
  if (/esporte|fitness|corrida|surf/.test(value)) {
    return {
      criteria: ["objetivo de uso", "nível de experiência", "ajuste e ergonomia", "material", "frequência de treino"],
      practicalTip: "Defina se o uso será casual, frequente ou intenso; isso ajuda a escolher sem pagar por recursos que você não usará.",
      comparisonTip: "Compare conforto, ajuste, resistência e adequação à atividade, não apenas cor ou popularidade.",
      caution: "Itens esportivos precisam respeitar seu perfil e condição. Em caso de dor ou limitação, procure orientação qualificada.",
    };
  }
  if (/brinquedo|colecion/.test(value)) {
    return {
      criteria: ["faixa etária", "dimensões", "materiais", "certificações aplicáveis", "necessidade de supervisão"],
      practicalTip: "Cruze idade, interesse e espaço disponível; um bom presente precisa ser adequado à pessoa e ao ambiente.",
      comparisonTip: "Observe segurança, durabilidade, proposta de brincadeira e facilidade de guardar ou transportar.",
      caution: "Respeite a faixa etária e as advertências do fabricante, especialmente para peças pequenas e componentes elétricos.",
    };
  }
  if (/café|chocolate|alimento|tempero/.test(value)) {
    return {
      criteria: ["ingredientes", "alergênicos", "peso líquido", "validade", "armazenamento"],
      practicalTip: "Confira quantidade, ingredientes e forma de conservação para escolher uma opção adequada ao consumo planejado.",
      comparisonTip: "Compare preço por peso, perfil de sabor, origem informada e condições de armazenamento.",
      caution: "Pessoas com alergias ou restrições devem conferir a rotulagem oficial antes do consumo.",
    };
  }
  if (/livro|editora/.test(value)) {
    return {
      criteria: ["tema e objetivo da leitura", "sinopse", "edição", "formato", "perfil do leitor"],
      practicalTip: "Use a sinopse e o sumário para verificar se profundidade, linguagem e abordagem combinam com sua intenção.",
      comparisonTip: "Compare edição, formato, número de páginas e proposta editorial, não apenas o título.",
      caution: "Verifique idioma, edição e formato antes da compra, principalmente em livros técnicos ou para presente.",
    };
  }
  if (/viagem|seguro/.test(value)) {
    return {
      criteria: ["destino e datas", "coberturas", "limites", "exclusões", "canais de assistência"],
      practicalTip: "Monte a cotação com destino, duração e perfil dos viajantes para comparar coberturas equivalentes.",
      comparisonTip: "Compare limites, exclusões e forma de atendimento; o menor preço nem sempre representa a mesma proteção.",
      caution: "Leia as condições gerais e confirme exigências do destino. Seguro e assistência possuem regras contratuais.",
    };
  }
  if (/pet/.test(value)) {
    return {
      criteria: ["espécie e porte", "fase de vida", "composição ou material", "tamanho", "orientações de uso"],
      practicalTip: "Escolha considerando espécie, porte, idade e rotina do animal, não apenas avaliações de outros tutores.",
      comparisonTip: "Compare adequação ao pet, durabilidade, composição e facilidade de higienização.",
      caution: "Para alimentação, saúde ou comportamento, valide a escolha com um médico-veterinário.",
    };
  }
  if (/ferramenta/.test(value)) {
    return {
      criteria: ["tipo de projeto", "potência", "voltagem", "acessórios inclusos", "recursos de segurança"],
      practicalTip: "Liste os materiais e a frequência de uso antes de comparar potência e acessórios.",
      comparisonTip: "Compare robustez, ergonomia, disponibilidade de consumíveis e assistência.",
      caution: "Use equipamentos de proteção e siga integralmente as orientações do fabricante.",
    };
  }
  if (/relógio|joia|berloque/.test(value)) {
    return {
      criteria: ["material", "medidas", "tipo de fecho", "resistência informada", "garantia"],
      practicalTip: "Confira dimensões e material para entender como a peça ficará no uso diário.",
      comparisonTip: "Compare acabamento, manutenção, versatilidade e garantia.",
      caution: "Resistência à água e composição devem ser confirmadas na ficha oficial; não presuma pelo visual.",
    };
  }
  return {
    criteria: ["necessidade principal", "especificações", "qualidade e durabilidade", "custo total", "troca e garantia"],
    practicalTip: "Defina o problema que deseja resolver e os critérios obrigatórios antes de começar a comparar.",
    comparisonTip: "Compare opções equivalentes e considere uso real, durabilidade, suporte e custo total.",
    caution: "Preço, estoque, frete e condições podem mudar. Confirme tudo na loja antes de concluir.",
  };
}

function storeLinkLabel(store: AffiliateStoreSeoInput) {
  return `Ver seleção de ${store.category.toLowerCase()} na ${store.name}`;
}

export function findStoreArticleTopic(slug: string) {
  return STORE_ARTICLE_TOPICS.find((topic) => topic.slug === slug) || null;
}

export function buildStoreArticle(store: AffiliateStoreSeoInput, topicSlug: string): StoreArticleContent | null {
  const topic = findStoreArticleTopic(topicSlug);
  if (!topic) return null;
  const profile = profileFor(store.category);
  const criteriaText = profile.criteria.join(", ");

  const commonFaq = [
    {
      question: `Como conferir as condições atuais da ${store.name}?`,
      answer: `Use o botão de acesso à loja e confirme preço, estoque, frete, cupons, prazo e política de troca diretamente no ambiente da ${store.name}.`,
    },
    {
      question: "Como comparar opções sem depender apenas do preço?",
      answer: `Defina primeiro os recursos obrigatórios, compare produtos equivalentes e considere custo total, durabilidade, garantia e adequação ao uso.`,
    },
  ];

  if (topic.slug === "guia-de-compras") {
    return {
      topic,
      title: `Guia de compras ${store.name}: como pesquisar ${store.category.toLowerCase()}`,
      description: `Um guia prático para planejar compras de ${store.category.toLowerCase()} na ${store.name}, comparar opções e evitar decisões por impulso.`,
      intro: `${store.defaultCopy} Antes de abrir dezenas de produtos, vale organizar a decisão. Este guia mostra como transformar uma busca ampla em critérios claros, comparar alternativas equivalentes e chegar à loja sabendo o que realmente importa.`,
      sections: [
        {
          title: "Comece pela necessidade, não pela promoção",
          paragraphs: [
            `Uma boa compra começa com uma pergunta simples: qual problema você quer resolver? Em ${store.category.toLowerCase()}, a resposta ajuda a separar recursos essenciais de detalhes que apenas aumentam o preço.`,
            `Anote contexto de uso, frequência, limite de orçamento e o que seria um resultado satisfatório. Essa preparação reduz compras por impulso e torna a navegação na ${store.name} mais objetiva.`,
          ],
          bullets: ["Necessidade principal", "Frequência de uso", "Orçamento máximo", "Características obrigatórias", "Prazo real para comprar"],
        },
        {
          title: "Critérios para comparar opções equivalentes",
          paragraphs: [
            `Os critérios mais úteis nesta categoria são ${criteriaText}. Abra duas ou três opções que atendam à mesma finalidade e compare esses pontos lado a lado.`,
            profile.comparisonTip,
          ],
        },
        {
          title: "Calcule o custo completo",
          paragraphs: [
            "O valor anunciado é apenas uma parte da decisão. Inclua frete, acessórios necessários, instalação, manutenção e possibilidade de troca.",
            "Cupom só representa economia quando a opção continua adequada à sua necessidade. Evite trocar qualidade ou compatibilidade por um desconto pequeno.",
          ],
        },
        {
          title: `Como usar este guia dentro da ${store.name}`,
          paragraphs: [
            `${profile.practicalTip} Depois, use filtros e categorias da loja para reduzir a seleção.`,
            `Quando encontrar uma opção promissora, leia a página completa, confirme as condições e só então avance. ${profile.caution}`,
          ],
        },
      ],
      faq: commonFaq,
    };
  }

  if (topic.slug === "como-escolher") {
    return {
      topic,
      title: `Como escolher na ${store.name}: critérios para comparar melhor`,
      description: `Veja o que comparar ao escolher ${store.category.toLowerCase()} na ${store.name} e monte uma decisão baseada no uso real.`,
      intro: `Escolher bem não significa encontrar a opção com mais recursos. Significa identificar o que combina com seu uso, seu orçamento e suas expectativas. Na categoria ${store.category.toLowerCase()}, alguns critérios tornam essa comparação muito mais confiável.`,
      sections: [
        {
          title: "Os cinco critérios que merecem atenção",
          paragraphs: [`Para esta categoria, priorize ${criteriaText}. Esses pontos ajudam a comparar produtos semelhantes sem depender apenas de avaliações genéricas.`],
          bullets: profile.criteria.map((criterion) => `${criterion.charAt(0).toUpperCase()}${criterion.slice(1)}`),
        },
        {
          title: "Elimine primeiro o que não serve",
          paragraphs: [
            "Antes de procurar a melhor opção, elimine as incompatíveis. Dimensão, perfil de uso, material, voltagem, faixa etária ou composição podem transformar uma oferta atraente em uma compra inadequada.",
            profile.practicalTip,
          ],
        },
        {
          title: "Compare benefício com frequência de uso",
          paragraphs: [
            "Recursos utilizados toda semana merecem mais peso do que detalhes ocasionais. Uma escolha mais simples pode ser melhor quando atende completamente à rotina.",
            profile.comparisonTip,
          ],
        },
        {
          title: "Faça uma decisão verificável",
          paragraphs: [
            `Crie uma lista curta com até três opções da ${store.name}. Para cada uma, registre pontos fortes, limitações, custo total e política de troca.`,
            `A melhor escolha será aquela que cumprir mais critérios obrigatórios com menos concessões. ${profile.caution}`,
          ],
        },
      ],
      faq: commonFaq,
    };
  }

  if (topic.slug === "ideias-e-inspiracoes") {
    return {
      topic,
      title: `${store.name}: ideias para aproveitar melhor ${store.category.toLowerCase()}`,
      description: `Inspirações e situações de uso para explorar a categoria ${store.category.toLowerCase()} na ${store.name} com mais intenção.`,
      intro: `Inspiração é mais útil quando ajuda a visualizar o uso real. Em vez de colecionar produtos em uma lista sem prioridade, pense em situações, pessoas e objetivos. A partir disso, a seleção da ${store.name} pode ser explorada com uma direção clara.`,
      sections: [
        {
          title: "Transforme inspiração em um pequeno projeto",
          paragraphs: [
            "Escolha um objetivo por vez: melhorar uma rotina, preparar um presente, renovar algo específico ou resolver uma necessidade recorrente.",
            `Para ${store.category.toLowerCase()}, descreva o resultado desejado em uma frase. Isso facilita identificar o que é necessário e o que é apenas complementar.`,
          ],
        },
        {
          title: "Três formas de organizar suas ideias",
          paragraphs: ["Use uma destas abordagens para não misturar desejos, prioridades e orçamento."],
          bullets: ["Por ambiente ou situação de uso", "Por pessoa ou perfil de presente", "Por prioridade: essencial, útil e opcional"],
        },
        {
          title: "Crie combinações com o que você já possui",
          paragraphs: [
            "Antes de adicionar algo novo, observe o que já funciona. Cores, tamanhos, compatibilidade, rotina e espaço disponível ajudam a formar combinações mais coerentes.",
            profile.comparisonTip,
          ],
        },
        {
          title: "Da lista de desejos para a decisão",
          paragraphs: [
            `Salve poucas opções da ${store.name} e retorne à lista depois. Se uma ideia continuar fazendo sentido fora do momento de entusiasmo, ela merece comparação.`,
            `${profile.practicalTip} ${profile.caution}`,
          ],
        },
      ],
      faq: commonFaq,
    };
  }

  if (topic.slug === "antes-de-comprar") {
    return {
      topic,
      title: `Antes de comprar na ${store.name}: checklist essencial`,
      description: `Um checklist para conferir detalhes, custo total e adequação antes de finalizar uma compra de ${store.category.toLowerCase()} na ${store.name}.`,
      intro: `Os minutos finais antes da compra são os mais importantes. É quando você confirma se a opção escolhida corresponde ao que foi pesquisado e se o custo final continua dentro do planejado.`,
      sections: [
        {
          title: "Confirme o produto certo",
          paragraphs: [
            `Revise nome, variação, tamanho, quantidade e características selecionadas. Na categoria ${store.category.toLowerCase()}, confira especialmente ${criteriaText}.`,
            profile.practicalTip,
          ],
        },
        {
          title: "Confira entrega, troca e garantia",
          paragraphs: [
            "Simule o frete com o CEP correto, observe o prazo estimado e verifique quem realiza a entrega. Leia também a política de troca e os canais de atendimento.",
            "Quando houver garantia, confirme duração, cobertura, documentos necessários e responsável pelo suporte.",
          ],
        },
        {
          title: "Revise o custo final",
          paragraphs: [
            "Confira subtotal, frete, descontos efetivamente aplicados e forma de pagamento. Evite concluir apenas porque um cronômetro ou mensagem de urgência apareceu.",
            "Faça uma última comparação com o orçamento definido. A oferta continua boa mesmo sem considerar o percentual destacado?",
          ],
        },
        {
          title: "Checklist de 30 segundos",
          paragraphs: ["Antes de confirmar, responda sim para todos os pontos abaixo."],
          bullets: ["É a variação correta", "Serve para minha necessidade", "O custo total está claro", "Li entrega e troca", "Estou no domínio oficial da loja"],
        },
        {
          title: "Atenção responsável",
          paragraphs: [profile.caution],
        },
      ],
      faq: commonFaq,
    };
  }

  return {
    topic,
    title: `Ofertas e novidades da ${store.name}: como acompanhar com segurança`,
    description: `Aprenda a acompanhar condições, cupons e novidades da ${store.name} sem confundir desconto anunciado com economia real.`,
    intro: `Uma página de ofertas útil não inventa urgência nem mantém preço antigo como se ainda estivesse válido. O objetivo aqui é ajudar você a acompanhar a ${store.name}, entender condições comerciais e validar tudo no momento da compra.`,
    sections: [
      {
        title: "O que caracteriza uma oferta real",
        paragraphs: [
          "Uma boa condição precisa ser verificável: preço atual, produto exato, período, estoque, regras do cupom e custo de entrega.",
          "Percentuais isolados não bastam. Compare o valor final com alternativas equivalentes e com o histórico que você conhece.",
        ],
      },
      {
        title: "Cupom, frete e forma de pagamento",
        paragraphs: [
          "Cupons podem exigir valor mínimo, categoria, primeira compra ou meio de pagamento específico. Leia as regras antes de considerar o desconto no orçamento.",
          "Frete pode anular uma diferença de preço. Sempre simule com seu CEP e observe se há retirada, entrega agendada ou outras modalidades.",
        ],
      },
      {
        title: `Como acompanhar a ${store.name}`,
        paragraphs: [
          `Use esta página como ponto de partida e confirme as condições diretamente na ${store.name}. Não exibiremos preço ou desconto sem uma fonte atualizada.`,
          `Para ${store.category.toLowerCase()}, mantenha seus critérios de qualidade: ${criteriaText}. Uma oferta só vale a pena quando o item continua adequado.`,
        ],
      },
      {
        title: "Evite urgência artificial",
        paragraphs: [
          "Pare por alguns minutos antes de finalizar. Revise necessidade, custo total e política de troca. Essa pausa é especialmente útil quando a decisão começou por uma notificação de promoção.",
          `${profile.comparisonTip} ${profile.caution}`,
        ],
      },
    ],
    faq: [
      ...commonFaq,
      {
        question: `Há um cupom ativo da ${store.name}?`,
        answer: "Cupons mudam com frequência. Quando houver uma condição confirmada, ela deverá ser validada na própria loja antes da compra.",
      },
    ],
  };
}

export function buildStoreHubDescription(store: AffiliateStoreSeoInput) {
  return `Conheça a ${store.name}, explore guias sobre ${store.category.toLowerCase()} e encontre informações para comparar produtos e decidir melhor.`;
}

export function buildStoreCtaLabel(store: AffiliateStoreSeoInput) {
  return storeLinkLabel(store);
}

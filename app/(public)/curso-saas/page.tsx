import type { Metadata } from "next";
import { CleanCourseLanding } from "@/components/course-sales/CleanCourseLanding";
import { resolveSalesPageMetaPixelId } from "@/lib/salesPagePixel";

const pageKey = "curso-saas";
const pagePath = "/curso-saas";
const pageTitle = "Curso SaaS com IA, Antigravity e Next.js | Plugando IA";
const price = Number(process.env.NEXT_PUBLIC_SAAS_PRICE ?? 29.9);
const checkoutUrl = process.env.NEXT_PUBLIC_SAAS_CHECKOUT_URL ?? "https://pay.hotmart.com/L107741495H?bid=1790201782816";
const offerAvailable = price > 0 && /^https?:\/\//.test(checkoutUrl);

export const metadata: Metadata = {
  title: pageTitle,
  description: "Construa um SaaS completo com Antigravity, Next.js, PostgreSQL, trial, assinatura, pagamento, Docker e deploy. Inclui 7 cursos complementares.",
  alternates: { canonical: pagePath },
};

const saasLessons = [
  "Criando o prompt para gerar o sistema", "Criando o projeto com Antigravity", "Criando o banco PostgreSQL e gerando a conexão", "Testando o sistema e efetuando ajustes", "Testando o pagamento e criando o trial de 7 dias", "Efetuando login e testando o cadastro no trial", "Criando menu e cadastros de cliente, veículo, produto e serviço", "Testando a edição dos cadastros e criando a importação", "Efetuando a importação dos dados", "Ajustando alertas e testando a ordem de serviço", "Verificando o fluxo de pagamento", "Configurando o gateway e concluindo o pagamento", "Validando a assinatura", "Ajustando Dockerfile e .gitignore", "Publicando no GitHub e EasyPanel", "Hospedando, acessando e testando", "Efetuando um novo cadastro e validando o produto publicado",
];

const nextLessons = [
  "Introdução ao Next.js", "Criando o projeto", "Entendendo o projeto", "Rotas", "Layout.tsx", "Agrupamento de páginas", "Rotas dinâmicas", "Rota com slug", "Consulta à API de CEP usando a rota", "Título do site de acordo com a rota", "Server e Client Components", "Navegação com Link", "Formulários com useRouter", "Redirect no servidor", "replace, push, prefetch e back", "forward e refresh", "Tela de erro específica", "Componente e requisição Server", "Memoização e cache", "Middleware", "Server Actions", "Server Actions com formulário", "useFormState e useFormStatus", "Criando API com Next.js",
];

const curriculum = [
  { title: "SaaS com IA usando Antigravity", meta: "17 aulas", summary: "O projeto principal, da especificação ao sistema publicado.", lessons: saasLessons },
  { title: "Next.js", meta: "24 aulas", summary: "A base completa de App Router, componentes, dados, formulários e APIs.", lessons: nextLessons },
  { title: "Agentes de IA com Next.js", meta: "6 aulas", summary: "Crie a interface, conecte a OpenAI e desenvolva um agente com memória.", lessons: ["Criando o projeto de agentes", "Tela inicial para acessar os agentes", "Variável de ambiente e API Key OpenAI", "Action para se comunicar com a OpenAI", "ChatClient para conversar com a IA", "Agente com contexto e memória"] },
  { title: "Arquitetando com LLMs e RAG", meta: "13 aulas", summary: "Fundamentos para projetar sistemas de IA mais úteis e confiáveis.", lessons: ["Fundamentos", "Dominando a IA", "AI Agent Engineering", "RAG mitigando riscos", "Attention e Transformers", "IA Generativa", "Arquitetura de Agentes", "Hybrid Search in RAG", "Impacto estratégico dos LLMs", "Busca híbrida", "Sistemas de IA corporativa", "Avaliação de LLMs", "Guardrails de IA"] },
  { title: "Site para Advocacia com IA", meta: "9 aulas", summary: "Projeto aplicado com chatbot, automação, PostgreSQL, banco vetorial e RAG.", lessons: ["Criando o site", "Explicando as tags", "E-mail com n8n e Gmail", "Incluindo chatbot", "Bancos vetoriais", "PostgreSQL no Railway", "Arquivo no banco vetorial", "Metadata", "Agente com RAG"] },
  { title: "Agente de IA", meta: "4 aulas", summary: "Entenda agentes, memória e ferramentas.", lessons: ["Fundamentos de agentes", "Primeiro agente com memória", "Criação rápida de agente", "Agente com tools"] },
  { title: "Credenciais", meta: "2 aulas", summary: "Configure acessos para integrar serviços reais.", lessons: ["Credencial Gmail/Google", "Credencial OpenAI"] },
  { title: "n8n Básico", meta: "10 aulas", summary: "Automatize processos com workflows, lógica, código e HTTP.", lessons: ["Workflows", "Credenciais", "Execuções", "Importação e exportação", "Triggers", "Ações", "Condicional IF", "Soma, máximo, mínimo e filtro", "Nó Code", "HTTP Request"] },
];

const included = curriculum.slice(1).map((item, index) => ({
  eyebrow: `Curso complementar ${String(index + 1).padStart(2, "0")}`,
  title: item.title,
  meta: item.meta,
  description: item.summary,
}));

export default async function CursoSaasPage() {
  const metaPixelId = await resolveSalesPageMetaPixelId(pageKey, { preferEnvFallback: true });
  return <CleanCourseLanding
    pageKey={pageKey}
    pagePath={pagePath}
    pageTitle={pageTitle}
    name="SaaS com IA usando Antigravity"
    metaPixelId={metaPixelId || undefined}
    eyebrow="Projeto completo com Antigravity e Next.js"
    headline="Construa um SaaS completo e coloque o produto no ar."
    description="Acompanhe a criação de um sistema de gestão com login, banco de dados, clientes, serviços, trial, assinatura, pagamento e deploy. Você aprende usando IA para acelerar cada etapa, sem deixar de testar e validar o produto."
    notice="Nova turma com condição especial de lançamento"
    ctaLabel={offerAvailable ? "Quero construir meu SaaS" : "Ver as 85 aulas"}
    checkoutUrl={checkoutUrl}
    price={price || undefined}
    offerAvailable={offerAvailable}
    stats={[{ value: "8", label: "cursos no pacote" }, { value: "85", label: "aulas organizadas" }, { value: "9x R$ 3,93", label: "parcelamento disponível" }, { value: "R$ 29,90", label: "à vista" }]}
    heroPoints={["Projeto do início ao deploy", "Curso completo de Next.js", "7 cursos complementares"]}
    problemTitle="Gerar código é rápido. Transformar esse código em produto exige método."
    problemDescription="Um SaaS precisa de muito mais do que uma tela bonita: dados, acesso, regras, cobrança, infraestrutura e validação precisam funcionar juntos."
    problems={[
      { title: "A ideia não vira sistema", description: "Sem uma especificação clara, a IA gera partes desconectadas e difíceis de evoluir." },
      { title: "O projeto para no localhost", description: "Docker, repositório, servidor, ambiente e banco precisam estar preparados para o deploy." },
      { title: "A cobrança não fecha", description: "Trial, assinatura, pagamento e validação precisam formar um fluxo comercial completo." },
    ]}
    outcomeTitle="Você termina com um produto funcionando, não apenas com arquivos de código"
    outcomeDescription="O projeto percorre as etapas que transformam uma ideia em um sistema acessível e testável na internet."
    outcomes={[
      { title: "Especificar com clareza", description: "Transforme a ideia do produto em instruções que geram uma base mais consistente." },
      { title: "Construir a operação", description: "Implemente clientes, veículos, produtos, serviços, importação e ordens de serviço." },
      { title: "Criar o modelo comercial", description: "Configure trial, login, assinatura, pagamento e validação do acesso." },
      { title: "Publicar e validar", description: "Prepare Docker, GitHub, EasyPanel, hospedagem e teste o sistema em produção." },
    ]}
    curriculumTitle="85 aulas para construir e compreender o produto"
    curriculumDescription="O curso principal mostra o SaaS completo. Os treinamentos complementares aprofundam Next.js, automação, agentes e RAG."
    curriculum={curriculum}
    includedTitle="Sete cursos complementares incluídos"
    includedDescription="Você recebe a base técnica necessária para entender e reaplicar o que foi usado no projeto principal."
    included={included}
    fitTitle="Para quem quer usar IA para entregar produtos, não apenas gerar exemplos"
    fitItems={["Devs que querem construir o primeiro SaaS", "Quem quer aprender Antigravity em um projeto completo", "Profissionais que precisam dominar Next.js", "Quem quer integrar assinatura e pagamento", "Quem deseja publicar um produto real", "Freelancers buscando entregas de maior valor"]}
    offerTitle="Do prompt ao produto publicado em uma formação"
    offerDescription="Entre na nova turma e receba o curso principal de SaaS mais sete cursos que aprofundam as tecnologias e os conceitos usados no projeto."
    offerItems={["8 cursos", "85 aulas", "SaaS com Antigravity", "Next.js completo", "n8n e integrações", "Agentes, LLMs e RAG"]}
    offerNote={offerAvailable ? "Você será direcionado para o checkout, onde poderá conferir as condições antes de concluir." : "O preço e o checkout serão exibidos aqui quando a nova turma for aberta."}
    faq={[
      ["Preciso dominar Next.js?", "Não. O pacote inclui um curso de Next.js com 24 aulas, cobrindo as bases usadas no projeto."],
      ["O que é construído?", "Um SaaS de gestão com login, trial, clientes, veículos, produtos, serviços, ordens, importação, assinatura e pagamento."],
      ["O projeto é publicado?", "Sim. A jornada passa por Dockerfile, GitHub, EasyPanel, hospedagem e validação final."],
      ["Antigravity faz tudo sozinho?", "Não. Ele acelera a execução, mas você aprende a especificar, testar, corrigir e validar cada etapa."],
      ["Os bônus estão incluídos?", "Sim. Next.js, agentes, RAG, site com IA, credenciais e n8n fazem parte do pacote."],
      ["Qual será o preço?", "A condição de lançamento será adicionada à página quando a nova turma for aberta."],
    ]}
  />;
}

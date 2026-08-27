import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Curso de Programação para Iniciantes | C#, .NET, Backend e IA",
  description: "Comece programação do zero com lógica, C#, .NET, APIs, arquitetura, cloud e projetos práticos em uma trilha organizada para iniciantes.",
  alternates: { canonical: "/curso-programacao" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Curso de Programação para Iniciantes | Plugando IA",
    description: "Uma trilha do primeiro código a APIs, arquitetura e cloud.",
    url: "/curso-programacao",
    type: "website",
  },
};

const modules = [
  ["1", "Lógica e fundamentos", "Variáveis, condições, repetições, funções e raciocínio para começar com segurança."],
  ["2", "C# e .NET", "Aprenda a linguagem e use seus fundamentos em exercícios e aplicações reais."],
  ["3", "APIs e banco de dados", "Construa uma Web API com CRUD, autenticação, Entity Framework e PostgreSQL."],
  ["4", "Arquitetura e cloud", "Entenda organização de sistemas, princípios de software e publicação na AWS."],
];

export default function CursoProgramacaoPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,_#14532d,_transparent_38%),linear-gradient(135deg,#07111f,#111827_58%,#0f2d25)]">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-lime-300">Formação Plugando IA</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight md:text-6xl">Curso de programação para iniciantes: comece do zero e construa projetos reais.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Uma jornada organizada para quem quer aprender lógica, C#, .NET, APIs, arquitetura de software e cloud sem pular os fundamentos.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/curso-completo?utm_source=seo&utm_medium=organic&utm_campaign=curso-programacao" className="rounded-xl bg-lime-300 px-6 py-3 font-black text-slate-950 transition hover:bg-lime-200">Conhecer a formação completa</Link>
            <a href="#trilha" className="rounded-xl border border-white/25 px-6 py-3 font-black text-white hover:bg-white/10">Ver a trilha</a>
          </div>
          <p className="mt-5 text-sm text-slate-400">Sem pré-requisito de experiência. O ponto de partida é a lógica de programação.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16" id="trilha">
        <h2 className="text-3xl font-black md:text-4xl">O que você aprende em um curso de programação para iniciantes?</h2>
        <p className="mt-4 max-w-3xl leading-7 text-slate-300">Programar não é decorar comandos. Você aprende a transformar um problema em uma sequência de passos, escrever código, testar, organizar e publicar uma aplicação. Por isso a formação é progressiva.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {modules.map(([number, title, description]) => <article key={number} className="rounded-2xl border border-white/10 bg-white/5 p-6"><span className="text-sm font-black text-lime-300">MÓDULO {number}</span><h3 className="mt-3 text-xl font-black">{title}</h3><p className="mt-2 leading-7 text-slate-300">{description}</p></article>)}
        </div>
      </section>

      <section className="bg-white py-16 text-slate-900"><div className="mx-auto max-w-6xl px-6 grid gap-10 md:grid-cols-2"><div><p className="text-sm font-black uppercase tracking-widest text-emerald-700">Para quem é</p><h2 className="mt-3 text-3xl font-black">Para quem quer aprender programação do jeito certo.</h2><ul className="mt-6 space-y-3 leading-7 text-slate-700"><li>• Você começa do zero e não sabe por onde entrar.</li><li>• Já assistiu aulas soltas, mas não conseguiu conectar os assuntos.</li><li>• Quer criar APIs e entender como sistemas reais são organizados.</li><li>• Quer usar IA como acelerador, sem depender dela no escuro.</li></ul></div><div className="rounded-2xl bg-slate-100 p-7"><h2 className="text-2xl font-black">Antes de escolher um curso</h2><p className="mt-3 leading-7 text-slate-700">Veja nossos guias gratuitos para entender o caminho e tomar uma decisão com mais segurança.</p><div className="mt-6 space-y-3 font-bold text-emerald-800"><Link className="block hover:underline" href="/guia-programacao/aprender-programacao-do-zero">Como aprender programação do zero →</Link><Link className="block hover:underline" href="/guia-programacao/logica-de-programacao">Lógica de programação para iniciantes →</Link><Link className="block hover:underline" href="/guia-programacao/csharp-para-iniciantes">C# para iniciantes: roadmap →</Link></div></div></div></section>

      <section className="mx-auto max-w-6xl px-6 py-16"><div className="rounded-3xl border border-lime-300/30 bg-lime-300/10 p-8 md:p-12"><h2 className="text-3xl font-black">Pronto para sair do conteúdo solto?</h2><p className="mt-4 max-w-2xl text-lg leading-8 text-slate-200">Veja o currículo, os projetos e as condições atuais da Formação Desenvolvedor Full Stack + IA.</p><Link href="/curso-completo?utm_source=seo&utm_medium=organic&utm_campaign=curso-programacao" className="mt-7 inline-flex rounded-xl bg-lime-300 px-6 py-3 font-black text-slate-950 hover:bg-lime-200">Ir para a formação completa</Link></div></section>
    </main>
  );
}

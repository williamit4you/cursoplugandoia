import Link from "next/link";
import type { PetSeoArticle } from "@/lib/pet-seo/agents";
import { PetAffiliateCta } from "./PetAffiliateCta";

export function PetContentArticle({ article, path, relatedLinks = [], localUnits = [] }: {
  article: PetSeoArticle;
  path: string;
  relatedLinks?: Array<{ path: string; title: string }>;
  localUnits?: Array<{ id: string; name: string; address: string; phone: string | null; sourceUrl: string; verifiedAt: Date }>;
}) {
  return (
    <>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700">{article.intro}</p>
      <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        O Compra Esperta é um site independente e pode receber comissão por compras feitas pelos links de parceiro, sem custo adicional para você. Preço, estoque, entrega e condições devem ser confirmados na loja.
      </div>
      <div className="mt-10 space-y-12">
        {article.sections.map((section, index) => <section key={`${section.heading}-${index}`}>
          <h2 className="font-serif text-3xl font-black text-slate-950">{section.heading}</h2>
          <div className="mt-4 space-y-4">{section.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex} className="text-base leading-8 text-slate-700">{paragraph}</p>)}</div>
          {section.bullets?.length ? <ul className="mt-5 list-disc space-y-2 pl-6 text-slate-700">{section.bullets.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}</ul> : null}
          {section.subsections?.map((subsection, subsectionIndex) => <div key={`${subsection.heading}-${subsectionIndex}`} className="mt-7 rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-xl font-black text-slate-950">{subsection.heading}</h3>
            <div className="mt-3 space-y-3">{subsection.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex} className="leading-7 text-slate-700">{paragraph}</p>)}</div>
            {subsection.bullets?.length ? <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700">{subsection.bullets.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}</ul> : null}
          </div>)}
        </section>)}
      </div>

      {localUnits.length ? <section className="mt-12"><h2 className="font-serif text-3xl font-black text-slate-950">Unidades com informações verificadas</h2><div className="mt-5 grid gap-4 md:grid-cols-2">{localUnits.map((unit) => <article key={unit.id} className="rounded-2xl border border-slate-200 bg-white p-6"><h3 className="text-xl font-black">{unit.name}</h3><p className="mt-3 leading-7 text-slate-700">{unit.address}</p>{unit.phone ? <p className="mt-2 text-sm text-slate-600">Telefone: {unit.phone}</p> : null}<p className="mt-3 text-xs text-slate-500">Informação conferida em {unit.verifiedAt.toLocaleDateString("pt-BR")}.</p></article>)}</div></section> : null}

      <aside className="mt-12 rounded-[30px] bg-[linear-gradient(135deg,#ecfdf5,#f0fdf4)] p-7 sm:p-9"><div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Loja parceira</div><h2 className="mt-3 font-serif text-3xl font-black text-slate-950">Confira as opções disponíveis</h2><p className="mt-3 max-w-2xl leading-7 text-slate-700">Use o botão para consultar os produtos e as condições atuais. O redirecionamento aplica automaticamente o link de afiliado cadastrado.</p><div className="mt-6"><PetAffiliateCta campaign={path.replace(/\//g, "_")} /></div></aside>

      {article.faq.length ? <section className="mt-12"><h2 className="font-serif text-3xl font-black text-slate-950">Dúvidas frequentes</h2><div className="mt-5 space-y-4">{article.faq.map((item, index) => <article key={index} className="rounded-2xl border border-slate-200 bg-white p-6"><h3 className="text-lg font-black text-slate-950">{item.question}</h3><p className="mt-3 leading-7 text-slate-700">{item.answer}</p></article>)}</div></section> : null}

      {relatedLinks.length ? <nav aria-label="Conteúdos relacionados" className="mt-12 border-t border-slate-200 pt-8"><h2 className="text-2xl font-black">Continue pesquisando</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{relatedLinks.map((item) => <Link key={item.path} href={`/${item.path}`} className="rounded-2xl border border-slate-200 bg-white p-5 font-black text-emerald-700 hover:border-emerald-300">{item.title}</Link>)}</div></nav> : null}
    </>
  );
}


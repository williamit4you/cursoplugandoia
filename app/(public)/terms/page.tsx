export const dynamic = "force-static";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight text-slate-100">Termos de Uso</h1>
      <p className="mt-3 text-sm text-slate-300">
        Última atualização: 18/05/2026
      </p>

      <section className="mt-8 space-y-4 text-sm leading-7 text-slate-200">
        <p>
          Estes Termos de Uso (“Termos”) regem o acesso e uso da plataforma Plugando IA (“Plataforma”), incluindo
          páginas públicas (ex.: “link na bio”) e áreas administrativas.
        </p>

        <h2 className="pt-4 text-xl font-black tracking-tight text-slate-100">1. O que a Plataforma faz</h2>
        <p>
          A Plataforma auxilia na organização, criação e publicação de conteúdo de vídeo para redes sociais, incluindo
          automações relacionadas a produtos e links externos (por exemplo, links de afiliado). A Plataforma pode integrar
          com serviços de terceiros (ex.: Meta/Instagram, YouTube, TikTok) para permitir postagem e agendamento.
        </p>

        <h2 className="pt-4 text-xl font-black tracking-tight text-slate-100">2. Contas e acesso</h2>
        <p>
          Você é responsável por manter a confidencialidade das credenciais de acesso e por todas as ações realizadas
          na sua conta.
        </p>

        <h2 className="pt-4 text-xl font-black tracking-tight text-slate-100">3. Conteúdo e responsabilidade</h2>
        <p>
          Você é o único responsável pelo conteúdo publicado, incluindo títulos, descrições, vídeos, imagens e quaisquer
          alegações comerciais. Você concorda em não publicar conteúdo ilegal, enganoso, ofensivo, que viole direitos de
          terceiros ou as políticas das plataformas integradas.
        </p>

        <h2 className="pt-4 text-xl font-black tracking-tight text-slate-100">4. Links externos e afiliados</h2>
        <p>
          A Plataforma pode exibir links externos (incluindo links de afiliado) que direcionam para sites de terceiros.
          Não controlamos e não nos responsabilizamos por conteúdo, políticas, preços, entregas ou quaisquer práticas
          desses terceiros.
        </p>

        <h2 className="pt-4 text-xl font-black tracking-tight text-slate-100">5. Integrações de terceiros</h2>
        <p>
          O uso de integrações (Meta/Instagram, YouTube, TikTok etc.) depende de você possuir conta nesses serviços e
          aceitar seus respectivos termos. Podemos suspender ou alterar integrações a qualquer momento, por mudanças
          técnicas, requisitos de segurança ou políticas de terceiros.
        </p>

        <h2 className="pt-4 text-xl font-black tracking-tight text-slate-100">6. Disponibilidade e alterações</h2>
        <p>
          A Plataforma pode sofrer indisponibilidades, manutenções e mudanças. Podemos atualizar estes Termos a qualquer
          momento. A data de “Última atualização” indica a versão vigente.
        </p>

        <h2 className="pt-4 text-xl font-black tracking-tight text-slate-100">7. Contato</h2>
        <p>
          Em caso de dúvidas, entre em contato pelo canal oficial de suporte divulgado na Plataforma.
        </p>

        <p className="pt-4 text-xs text-slate-400">
          Nota: este texto é informativo e não constitui aconselhamento jurídico.
        </p>
      </section>
    </main>
  );
}


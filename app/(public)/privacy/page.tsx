export const dynamic = "force-static";

export default function PrivacyPage() {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://plugandoia.cloud").trim().replace(/\/+$/, "");

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight text-slate-100">Política de Privacidade</h1>
      <p className="mt-3 text-sm text-slate-300">
        Última atualização: 19/05/2026
      </p>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
        <div>
          <strong>Aplicativo:</strong> PlugandoIA (também referido como “plugandoia”)
        </div>
        <div className="mt-1">
          <strong>Site oficial:</strong>{" "}
          <a className="underline hover:text-slate-100" href={siteUrl} target="_blank" rel="noreferrer">
            {siteUrl}
          </a>
        </div>
      </div>

      <section className="mt-8 space-y-4 text-sm leading-7 text-slate-200">
        <p>
          Esta Política de Privacidade explica como o aplicativo PlugandoIA (“PlugandoIA”, “Plataforma”) coleta, usa e
          compartilha informações quando você utiliza nossas páginas públicas (ex.: “link na bio”) e áreas administrativas.
        </p>

        <h2 className="pt-4 text-xl font-black tracking-tight text-slate-100">1. Dados que coletamos</h2>
        <p>
          Podemos coletar:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-slate-200">
          <li>
            <strong>Dados de navegação e cliques</strong>: ao clicar em “Comprar agora” na vitrine pública, registramos um
            evento de clique (ex.: data/hora, origem, user-agent e um hash do IP) para fins de métricas.
          </li>
          <li>
            <strong>Dados de integração</strong>: quando você configura integrações (ex.: Meta/Instagram, YouTube, TikTok),
            podemos armazenar tokens/credenciais necessários para publicar conteúdos em seu nome.
          </li>
          <li>
            <strong>Dados de conteúdo</strong>: títulos, descrições, links, vídeos e imagens que você envia/gera na Plataforma.
          </li>
        </ul>

        <h2 className="pt-4 text-xl font-black tracking-tight text-slate-100">2. Como usamos os dados</h2>
        <ul className="list-disc pl-5 space-y-1 text-slate-200">
          <li>Operar a Plataforma e suas funcionalidades (vitrine, geração e agendamento).</li>
          <li>Publicar conteúdos nas plataformas integradas quando você habilitar essa função.</li>
          <li>Medir desempenho (ex.: cliques por produto) e melhorar a experiência.</li>
          <li>Prevenir abuso, fraude e incidentes de segurança.</li>
        </ul>

        <h2 className="pt-4 text-xl font-black tracking-tight text-slate-100">3. Compartilhamento</h2>
        <p>
          Compartilhamos dados apenas quando necessário para operar integrações com terceiros (ex.: Meta/Instagram, YouTube,
          TikTok) ou cumprir obrigações legais. Não vendemos seus dados pessoais.
        </p>

        <h2 className="pt-4 text-xl font-black tracking-tight text-slate-100">4. Retenção</h2>
        <p>
          Mantemos os dados pelo tempo necessário para cumprir as finalidades descritas nesta política, ou conforme exigido
          por lei. Você pode desativar integrações, o que interrompe novas publicações automáticas.
        </p>

        <h2 className="pt-4 text-xl font-black tracking-tight text-slate-100">5. Segurança</h2>
        <p>
          Adotamos medidas razoáveis para proteger informações armazenadas. Ainda assim, nenhum sistema é 100% seguro.
        </p>

        <h2 className="pt-4 text-xl font-black tracking-tight text-slate-100">6. Seus direitos</h2>
        <p>
          Você pode solicitar correção, atualização ou remoção de dados associados à sua conta, quando aplicável, por meio
          do canal oficial de suporte divulgado na Plataforma.
        </p>

        <h2 className="pt-4 text-xl font-black tracking-tight text-slate-100">7. Alterações</h2>
        <p>
          Podemos atualizar esta política. A data de “Última atualização” indica a versão vigente.
        </p>

        <p className="pt-4 text-xs text-slate-400">
          Nota: este texto é informativo e não constitui aconselhamento jurídico.
        </p>
      </section>
    </main>
  );
}

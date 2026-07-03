import { MetaPixelTestPanel } from "@/components/MetaPixelTestPanel";
import { Section } from "@/components/landing/section";

export const metadata = {
  title: "Pixel Test | Plugando IA",
  description: "Ambiente temporário para validar eventos do Meta Pixel pelo Test Events.",
};

export default function PixelTestPage() {
  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />

      <Section className="pb-16 pt-12 md:pt-20">
        <div className="mx-auto max-w-4xl rounded-[28px] border border-white/10 bg-white/5 p-8 shadow-glow">
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Meta Pixel Test Events</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
            Use esta página temporária para disparar eventos manualmente e validar o recebimento no painel Test Events
            da Meta.
          </p>

          <div className="mt-8">
            <MetaPixelTestPanel />
          </div>
        </div>
      </Section>
    </main>
  );
}

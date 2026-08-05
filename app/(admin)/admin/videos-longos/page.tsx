import dynamic from "next/dynamic";

const LongFormMarketingApp = dynamic(
  () =>
    import("@/components/LongFormMarketingApp").then(
      (mod) => mod.LongFormMarketingApp,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
        <p className="text-sm font-semibold text-slate-500">
          Carregando videos longos...
        </p>
      </div>
    ),
  },
);

export default function VideosLongosPage() {
  return <LongFormMarketingApp />;
}

import { Info } from "lucide-react";

export default function CommercialDisclosure({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const style = tone === "dark"
    ? "border-white/10 bg-white/[0.04] text-slate-400"
    : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <div className={`flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-xs leading-5 ${style}`}>
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        Conteúdo independente para apoiar sua pesquisa. Confirme preço, estoque, frete e condições diretamente na loja antes de comprar.
      </p>
    </div>
  );
}

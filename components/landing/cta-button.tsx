import Link from "next/link";

export function CTAButton({
  href,
  variant = "primary"
}: {
  href: string;
  variant?: "primary" | "secondary";
}) {
  const base =
    "group relative inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:ring-offset-0";
  const primary =
    "bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-emerald-400 text-base-950 shadow-[0_10px_35px_rgba(34,211,238,0.18)] hover:brightness-110";
  const secondary = "border border-white/10 bg-white/5 text-white hover:bg-white/10";

  return (
    <Link href={href} className={`${base} ${variant === "primary" ? primary : secondary}`}>
      <span className="absolute inset-0 -z-10 rounded-xl bg-[length:200%_200%] opacity-0 blur-xl transition duration-500 group-hover:opacity-60 group-hover:animate-shimmer bg-gradient-to-r from-cyan-400/30 via-fuchsia-400/30 to-emerald-400/30" />
      Quero aprender IA agora
    </Link>
  );
}


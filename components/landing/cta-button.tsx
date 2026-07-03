"use client";

import Link from "next/link";
import { MouseEventHandler } from "react";

export function CTAButton({
  href,
  variant = "primary",
  label = "Quero aprender IA agora",
  onClick,
}: {
  href: string;
  variant?: "primary" | "secondary";
  label?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  const base =
    "group relative inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:ring-offset-0";
  const primary =
    "bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-emerald-400 text-base-950 shadow-[0_10px_35px_rgba(34,211,238,0.18)] hover:brightness-110";
  const secondary = "border border-white/10 bg-white/5 text-white hover:bg-white/10";
  const className = `${base} ${variant === "primary" ? primary : secondary}`;
  const isExternalHref = /^https?:\/\//.test(href);

  if (isExternalHref) {
    return (
      <a className={className} href={href} onClick={onClick}>
        <span className="absolute inset-0 -z-10 rounded-xl bg-[length:200%_200%] opacity-0 blur-xl transition duration-500 group-hover:opacity-60 group-hover:animate-shimmer bg-gradient-to-r from-cyan-400/30 via-fuchsia-400/30 to-emerald-400/30" />
        {label}
      </a>
    );
  }

  return (
    <Link className={className} href={href} onClick={onClick}>
      <span className="absolute inset-0 -z-10 rounded-xl bg-[length:200%_200%] opacity-0 blur-xl transition duration-500 group-hover:opacity-60 group-hover:animate-shimmer bg-gradient-to-r from-cyan-400/30 via-fuchsia-400/30 to-emerald-400/30" />
      {label}
    </Link>
  );
}

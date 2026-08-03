"use client";

import { useState } from "react";

export default function BioCtaButton(params: { slug: string; href: string }) {
  const { slug, href } = params;
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/bio/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, source: "bio" }),
      }).catch(() => null);
    } finally {
      window.location.href = href;
    }
  };

  return (
    <button
      onClick={onClick}
      className="w-full rounded-[22px] bg-[linear-gradient(135deg,#ff4f95_0%,#ff8b59_55%,#ffc95c_100%)] px-5 py-4 text-base font-black text-white shadow-[0_14px_32px_rgba(255,105,156,0.24)] transition hover:brightness-[1.03] disabled:opacity-60"
      disabled={loading}
      data-commerce-outbound-url={href}
      data-commerce-product-slug={slug}
    >
      {loading ? "Abrindo..." : "Comprar agora"}
    </button>
  );
}

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
      className="w-full rounded-2xl bg-emerald-500 px-5 py-4 text-base font-bold text-black hover:bg-emerald-400 transition disabled:opacity-60"
      disabled={loading}
    >
      {loading ? "Abrindo..." : "Comprar agora"}
    </button>
  );
}


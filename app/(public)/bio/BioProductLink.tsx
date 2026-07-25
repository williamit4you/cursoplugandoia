"use client";

import { useState } from "react";

export default function BioProductLink({ slug, href, children, className }: { slug: string; href: string; children: React.ReactNode; className?: string }) {
  const [opening, setOpening] = useState(false);

  const open = async () => {
    if (opening) return;
    setOpening(true);
    try {
      await fetch("/api/bio/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, source: "bio_grid" }),
      });
    } finally {
      window.location.assign(href);
    }
  };

  return <button type="button" onClick={open} disabled={opening} className={className}>{opening ? "Abrindo..." : children}</button>;
}

"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { pageView } from "@/lib/metaPixel";

export function MetaPixelPageTracker() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // The base script already sends the first PageView on initial load.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // App Router navigations need a manual PageView after client-side route changes.
    pageView();
  }, [pathname]);

  return null;
}

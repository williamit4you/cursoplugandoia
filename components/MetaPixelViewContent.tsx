"use client";

import { useEffect } from "react";
import { MetaPixelEventData, viewContent } from "@/lib/metaPixel";

export function MetaPixelViewContent({ data }: { data?: MetaPixelEventData }) {
  useEffect(() => {
    // Product pages can mount this helper to send ViewContent exactly when the page loads.
    viewContent(data);
  }, [data]);

  return null;
}

"use client";

import { useEffect, useRef } from "react";

export default function ClientPostTracker({ postId }: { postId: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      fetch(`/api/posts/${postId}/views`, { method: "PUT" }).catch(() => {});
    }
  }, [postId]);

  return null;
}

"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

export function FadeIn({
  children,
  delayMs = 0
}: {
  children: ReactNode;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.15 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={[
        "transition duration-700 will-change-transform",
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      ].join(" ")}
    >
      {children}
    </div>
  );
}


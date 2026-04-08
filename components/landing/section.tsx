import { ReactNode } from "react";

export function Section({
  children,
  className,
  id
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={className}>
      <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">{children}</div>
    </section>
  );
}


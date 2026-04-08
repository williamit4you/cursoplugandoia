export function FeatureGrid({
  items
}: {
  items: Array<{ title: string; desc: string }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.title}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
        >
          <div className="text-base font-semibold">{item.title}</div>
          <p className="mt-2 text-sm leading-relaxed text-white/70">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}

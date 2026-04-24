// @ts-nocheck
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export function BulletListScene(props: { items: string[]; title?: string }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = interpolate(frame, [0, Math.min(20, durationInFrames)], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0c0a19 0%, #15133a 50%, #0c0a19 100%)",
        color: "white",
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        padding: 80,
      }}
    >
      <div style={{ width: "100%", maxWidth: 1100 }}>
        {props.title ? (
          <div style={{ fontSize: 56, fontWeight: 900, marginBottom: 24, letterSpacing: -0.5 }}>{props.title}</div>
        ) : null}
        <div style={{ display: "grid", gap: 16 }}>
          {(props.items ?? []).slice(0, 8).map((item, idx) => {
            const itemEnter = interpolate(frame, [10 + idx * 6, 18 + idx * 6], [0, 1], { extrapolateRight: "clamp" });
            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "16px 18px",
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  transform: `translateY(${(1 - itemEnter) * 18}px)`,
                  opacity: itemEnter * progress,
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 999,
                    background: "linear-gradient(135deg, #7c3aed, #22c55e)",
                    marginTop: 10,
                    flexShrink: 0,
                  }}
                />
                <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.15 }}>{item}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// @ts-nocheck
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export function TimelineScene(props: { items: { label: string; text: string }[]; title?: string; backgroundColor?: string; textColor?: string; accentColor?: string; fontFamily?: string }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const fade = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const exit = interpolate(frame, [durationInFrames - 18, durationInFrames - 2], [1, 0], { extrapolateLeft: "clamp" });
  const items = (props.items ?? []).slice(0, 6);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: props.backgroundColor || "linear-gradient(135deg, #06121b 0%, #0a1f2b 45%, #06121b 100%)",
        color: props.textColor || "white",
        fontFamily: props.fontFamily || "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        padding: 80,
      }}
    >
      <div style={{ width: "100%", maxWidth: 1200, opacity: fade * exit }}>
        {props.title ? (
          <div style={{ fontSize: 56, fontWeight: 900, marginBottom: 24, letterSpacing: -0.5 }}>{props.title}</div>
        ) : null}
        <div style={{ position: "relative", paddingLeft: 28 }}>
          <div style={{ position: "absolute", left: 10, top: 4, bottom: 4, width: 4, borderRadius: 999, background: props.accentColor || "rgba(255,255,255,0.15)" }} />
          <div style={{ display: "grid", gap: 16 }}>
            {items.map((it, idx) => {
              const enter = interpolate(frame, [8 + idx * 6, 16 + idx * 6], [0, 1], { extrapolateRight: "clamp" });
              return (
                <div key={idx} style={{ display: "flex", gap: 14, alignItems: "flex-start", transform: `translateY(${(1 - enter) * 14}px)`, opacity: enter }}>
                  <div style={{ width: 22, height: 22, borderRadius: 999, background: props.accentColor || "linear-gradient(135deg, #22c55e, #7c3aed)", marginLeft: -2, marginTop: 8, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 26, opacity: 0.8, fontWeight: 800 }}>{it.label}</div>
                    <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1.12 }}>{it.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// @ts-nocheck
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export function TitleScene(props: { title: string; subtitle?: string; backgroundColor?: string; textColor?: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ fps, frame, config: { damping: 14, stiffness: 120 } });
  const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: props.backgroundColor || "linear-gradient(135deg, #0b1220 0%, #1f2a44 45%, #0b1220 100%)",
        color: props.textColor || "white",
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        padding: 80,
      }}
    >
      <div style={{ maxWidth: 1200, textAlign: "center", transform: `scale(${0.98 + enter * 0.04})`, opacity }}>
        <div style={{ fontSize: 86, fontWeight: 900, letterSpacing: -1, lineHeight: 1.05 }}>{props.title}</div>
        {props.subtitle ? (
          <div style={{ marginTop: 24, fontSize: 34, opacity: 0.9, fontWeight: 600 }}>{props.subtitle}</div>
        ) : null}
      </div>
    </div>
  );
}

// @ts-nocheck
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export function QuoteScene(props: { quote: string; author?: string }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const exit = interpolate(frame, [durationInFrames - 18, durationInFrames - 2], [1, 0], { extrapolateLeft: "clamp" });

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at 30% 20%, rgba(124,58,237,0.35), transparent 55%), radial-gradient(circle at 70% 70%, rgba(34,197,94,0.25), transparent 55%), #070813",
        color: "white",
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        padding: 90,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          padding: "56px 54px",
          borderRadius: 28,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          opacity: opacity * exit,
          transform: `translateY(${(1 - opacity) * 16}px)`,
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.08, letterSpacing: -0.8 }}>
          “{props.quote}”
        </div>
        {props.author ? (
          <div style={{ marginTop: 28, fontSize: 30, opacity: 0.85, fontWeight: 700 }}>{props.author}</div>
        ) : null}
      </div>
    </div>
  );
}

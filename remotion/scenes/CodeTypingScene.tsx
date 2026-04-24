// @ts-nocheck
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function CodeTypingScene(props: { code: string; title?: string; language?: string }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const code = String(props.code ?? "");
  const t = clamp(frame / Math.max(1, durationInFrames - 10), 0, 1);
  const count = Math.floor(code.length * t);
  const visible = code.slice(0, count);
  const cursorOpacity = interpolate(frame % 20, [0, 10, 20], [1, 0, 1]);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #070a10 0%, #0b1220 55%, #070a10 100%)",
        color: "white",
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        padding: 80,
      }}
    >
      <div style={{ width: "100%", maxWidth: 1200 }}>
        {props.title ? (
          <div style={{ fontSize: 44, fontWeight: 900, marginBottom: 18, letterSpacing: -0.6 }}>{props.title}</div>
        ) : null}
        <div
          style={{
            borderRadius: 18,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            padding: "28px 28px",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
            fontSize: 38,
            lineHeight: 1.25,
            minHeight: 220,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {visible}
          <span style={{ opacity: cursorOpacity, marginLeft: 2 }}>▌</span>
        </div>
        {props.language ? (
          <div style={{ marginTop: 10, fontSize: 16, opacity: 0.7, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
            {props.language}
          </div>
        ) : null}
      </div>
    </div>
  );
}

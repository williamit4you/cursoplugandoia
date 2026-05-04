// @ts-nocheck
import React from "react";
import { AbsoluteFill, Img, Video, interpolate, useCurrentFrame } from "remotion";

export const RetentionScene: React.FC<{
  url?: string;
  title?: string;
  durationInFrames: number;
  textColor?: string;
  backgroundColor?: string;
  accentColor?: string;
}> = ({ url, title, durationInFrames, textColor, backgroundColor, accentColor }) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, durationInFrames], [1.02, 1.1]);
  const pan = interpolate(frame, [0, durationInFrames], [-18, 18]);
  const isVideo = url?.match(/\.(mp4|webm|mov)$/i);
  const [error, setError] = React.useState(false);
  const hasMedia = Boolean(url && !error);
  const bg = backgroundColor || "#101827";
  const fg = textColor || "#ffffff";
  const accent = accentColor || "#facc15";

  return (
    <AbsoluteFill style={{ backgroundColor: bg, overflow: "hidden" }}>
      {hasMedia ? (
        isVideo ? (
          <Video
            src={url}
            onError={() => setError(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${zoom}) translateX(${pan}px)`,
            }}
            muted
            loop
          />
        ) : (
          <Img
            src={url}
            onError={() => setError(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${zoom}) translateX(${pan}px)`,
            }}
          />
        )
      ) : (
        <AbsoluteFill
          style={{
            background: `
              radial-gradient(circle at 20% 18%, ${accent}55 0, transparent 26%),
              radial-gradient(circle at 82% 72%, rgba(255,255,255,0.16) 0, transparent 28%),
              linear-gradient(145deg, ${bg} 0%, #101827 56%, #050816 100%)
            `,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 90,
              border: "1px solid rgba(255,255,255,0.16)",
              background:
                "linear-gradient(160deg, rgba(255,255,255,0.15), rgba(255,255,255,0.04))",
              boxShadow: "0 28px 80px rgba(0,0,0,0.28)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 130,
              right: 130,
              top: "34%",
              height: 18,
              borderRadius: 999,
              background: accent,
              opacity: 0.9,
              transform: `translateX(${pan * 0.6}px)`,
            }}
          />
        </AbsoluteFill>
      )}

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.08) 42%, rgba(0,0,0,0.68) 100%)",
        }}
      />

      {title ? (
        <div
          style={{
            position: "absolute",
            left: "8%",
            right: "8%",
            top: "12%",
            color: fg,
            fontSize: 62,
            fontWeight: 850,
            lineHeight: 1.05,
            letterSpacing: 0,
            textShadow: "0 4px 22px rgba(0,0,0,0.75)",
            fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
          }}
        >
          {title}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

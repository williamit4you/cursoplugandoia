// @ts-nocheck
import React from "react";
import { AbsoluteFill, Video, Img, interpolate, useCurrentFrame } from "remotion";

export const RetentionScene: React.FC<{
  url?: string;
  title?: string;
  durationInFrames: number;
  textColor?: string;
  backgroundColor?: string;
}> = ({ url, title, durationInFrames, textColor, backgroundColor }) => {
  const frame = useCurrentFrame();
  
  // Subtle zoom effect
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.1]);

  const isVideo = url?.match(/\.(mp4|webm|mov)$/i);

  const [error, setError] = React.useState(false);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundColor || "black", overflow: "hidden" }}>
      {url && !error ? (
        isVideo ? (
          <Video
            src={url}
            onError={() => setError(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${zoom})`,
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
              transform: `scale(${zoom})`,
            }}
          />
        )
      ) : (
        <div style={{ flex: 1, background: backgroundColor || "linear-gradient(45deg, #1a1a2e 0%, #16213e 100%)" }} />
      )}
      
      {/* Overlay darkening */}
      <AbsoluteFill style={{ backgroundColor: backgroundColor ? "transparent" : "rgba(0,0,0,0.3)" }} />

      {title && (
        <div
          style={{
            position: "absolute",
            top: "30%",
            width: "100%",
            textAlign: "center",
            color: textColor || "white",
            fontSize: 80,
            fontWeight: 800,
            textTransform: "uppercase",
            padding: "0 50px",
            textShadow: textColor === "#000000" ? "0 0 20px white" : "0 0 20px black",
          }}
        >
          {title}
        </div>
      )}
    </AbsoluteFill>
  );
};

// @ts-nocheck
import React from "react";
import { AbsoluteFill, Video, Img, interpolate, useCurrentFrame } from "remotion";

export const RetentionScene: React.FC<{
  url?: string;
  title?: string;
  durationInFrames: number;
}> = ({ url, title, durationInFrames }) => {
  const frame = useCurrentFrame();
  
  // Subtle zoom effect
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.1]);

  const isVideo = url?.match(/\.(mp4|webm|mov)$/i);

  return (
    <AbsoluteFill style={{ backgroundColor: "black", overflow: "hidden" }}>
      {url ? (
        isVideo ? (
          <Video
            src={url}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${zoom})`,
            }}
            muted
          />
        ) : (
          <Img
            src={url}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${zoom})`,
            }}
          />
        )
      ) : (
        <div style={{ flex: 1, backgroundColor: "#111" }} />
      )}
      
      {/* Overlay darkening */}
      <AbsoluteFill style={{ backgroundColor: "rgba(0,0,0,0.3)" }} />

      {title && (
        <div
          style={{
            position: "absolute",
            top: "30%",
            width: "100%",
            textAlign: "center",
            color: "white",
            fontSize: 80,
            fontWeight: 800,
            textTransform: "uppercase",
            padding: "0 50px",
            textShadow: "0 0 20px black",
          }}
        >
          {title}
        </div>
      )}
    </AbsoluteFill>
  );
};

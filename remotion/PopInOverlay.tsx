// @ts-nocheck
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill } from "remotion";

export type OverlayItem = {
  type: "emoji" | "icon" | "arrow";
  value: string;
  timeSec: number;
  position: "top" | "center" | "bottom";
};

export const PopInOverlay: React.FC<{ overlays: OverlayItem[] }> = ({ overlays }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {overlays.map((ov, i) => {
        const startFrame = ov.timeSec * fps;
        // Visible for 1.5 seconds
        const isVisible = frame >= startFrame && frame < startFrame + fps * 1.5;
        
        if (!isVisible) return null;

        const spr = spring({
          frame: frame - startFrame,
          fps,
          config: { stiffness: 200, damping: 10 },
        });

        const yPos = ov.position === "top" ? "20%" : ov.position === "bottom" ? "70%" : "50%";

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: yPos,
              left: "50%",
              transform: `translate(-50%, -50%) scale(${spr})`,
              fontSize: 200,
              zIndex: 200,
              filter: "drop-shadow(0 0 20px rgba(0,0,0,0.5))",
            }}
          >
            {ov.type === "emoji" ? ov.value : ov.value === "arrow" ? "➡️" : ov.value}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

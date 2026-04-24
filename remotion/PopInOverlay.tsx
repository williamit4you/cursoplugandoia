// @ts-nocheck
import React from "react";
import { useCurrentFrame, useVideoConfig, spring, AbsoluteFill, Audio } from "remotion";

export type OverlayItem = {
  type: "emoji" | "icon" | "arrow" | "woosh" | "pop" | "ding" | "success";
  value: string;
  timeSec: number;
  position: "top" | "center" | "bottom";
};

export const PopInOverlay: React.FC<{ overlays: OverlayItem[] }> = ({ overlays }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {overlays.map((ov, i) => {
        const startFrame = Math.round(ov.timeSec * fps);
        const isVisible = frame >= startFrame && frame < startFrame + fps * 1.5;
        
        // Handle SFX
        if (["woosh", "pop", "ding", "success"].includes(ov.type)) {
          // If it's just an audio effect, we only render the Audio component if we reached the frame
          if (isVisible) {
             // Descomente a linha abaixo apenas após adicionar os arquivos na pasta public/sfx/
             // return <Audio key={i} src={`/sfx/${ov.type}.mp3`} volume={0.5} />;
          }
          return null;
        }

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

// @ts-nocheck
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

export const CircleHighlightScene: React.FC<{
  centerText?: string;
  surroundingTexts?: string[];
  backgroundColor?: string;
  textColor?: string;
  circleColor?: string;
}> = ({
  centerText = "FOCO",
  surroundingTexts = ["Atenção", "Dinheiro", "Tempo"],
  backgroundColor = "#2962ff",
  textColor = "#ffffff",
  circleColor = "#ffeb3b"
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const centerScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 90 },
  });

  const pulse = Math.sin(frame / 10) * 0.05 + 1; // gentle pulse

  return (
    <AbsoluteFill style={{ backgroundColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Central Circle */}
      <div
        style={{
          width: 400,
          height: 400,
          borderRadius: 200,
          backgroundColor: circleColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${centerScale * pulse})`,
          boxShadow: `0 0 80px ${circleColor}80`,
          zIndex: 10,
        }}
      >
        <span style={{ color: backgroundColor, fontSize: 80, fontWeight: 900, textTransform: "uppercase", textAlign: "center", padding: 20 }}>
          {centerText}
        </span>
      </div>

      {/* Surrounding elements */}
      {surroundingTexts.map((text, i) => {
        const delay = (i + 1) * 15;
        const pop = spring({
          frame: Math.max(0, frame - delay),
          fps,
          config: { damping: 12 },
        });

        const angle = (i / surroundingTexts.length) * Math.PI * 2 - Math.PI / 2;
        const radius = 350; // distance from center
        const x = Math.cos(angle) * radius * pop;
        const y = Math.sin(angle) * radius * pop;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              transform: `translate(${x}px, ${y}px) scale(${pop})`,
              backgroundColor: textColor,
              color: backgroundColor,
              padding: "20px 40px",
              borderRadius: 40,
              fontSize: 45,
              fontWeight: 800,
              textTransform: "uppercase",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              zIndex: 20,
              opacity: pop,
            }}
          >
            {text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

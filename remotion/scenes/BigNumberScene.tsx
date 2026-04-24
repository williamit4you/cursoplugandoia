// @ts-nocheck
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

export const BigNumberScene: React.FC<{
  number?: string;
  subtitle?: string;
  backgroundColor?: string;
  textColor?: string;
  highlightColor?: string;
}> = ({
  number = "99%",
  subtitle = "das pessoas falham",
  backgroundColor = "#d50000",
  textColor = "#ffffff",
  highlightColor = "#ffeb3b"
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 80 },
  });

  const subOpacity = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { damping: 12 },
  });

  // Extract numeric part for counting animation if it's a number
  const isNumeric = !isNaN(parseFloat(number));
  let displayValue = number;
  
  if (isNumeric) {
    const numericVal = parseFloat(number);
    const suffix = number.replace(/[0-9.,]/g, '');
    const prefix = number.replace(/[^$€£]/g, ''); // basic currency prefix
    const animatedVal = interpolate(scale, [0, 1], [0, numericVal]);
    displayValue = `${prefix}${Math.round(animatedVal)}${suffix.replace(/[$€£]/g, '')}`;
  }

  return (
    <AbsoluteFill style={{ backgroundColor, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div
        style={{
          color: highlightColor,
          fontSize: 220,
          fontWeight: 900,
          textAlign: "center",
          fontFamily: "Impact, sans-serif",
          transform: `scale(${scale})`,
          textShadow: `0 20px 50px rgba(0,0,0,0.5)`,
          lineHeight: 1,
        }}
      >
        {displayValue}
      </div>
      <div
        style={{
          color: textColor,
          fontSize: 70,
          fontWeight: 800,
          textAlign: "center",
          textTransform: "uppercase",
          marginTop: 40,
          opacity: subOpacity,
          transform: `translateY(${interpolate(subOpacity, [0, 1], [40, 0])}px)`,
          textShadow: `0 10px 30px rgba(0,0,0,0.5)`,
        }}
      >
        {subtitle}
      </div>
    </AbsoluteFill>
  );
};

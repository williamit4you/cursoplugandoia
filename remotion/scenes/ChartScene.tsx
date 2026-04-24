// @ts-nocheck
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

export const ChartScene: React.FC<{
  title?: string;
  dataPoints?: { label: string; value: number }[];
  backgroundColor?: string;
  textColor?: string;
  chartColor?: string;
}> = ({
  title = "Crescimento",
  dataPoints = [{ label: "A", value: 30 }, { label: "B", value: 80 }, { label: "C", value: 100 }],
  backgroundColor = "#111111",
  textColor = "#ffffff",
  chartColor = "#00e676"
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({
    frame,
    fps,
    config: { damping: 12 },
  });

  const maxValue = Math.max(...dataPoints.map(d => d.value), 1);

  return (
    <AbsoluteFill style={{ backgroundColor, padding: 80, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div
        style={{
          color: textColor,
          fontSize: 80,
          fontWeight: 900,
          textAlign: "center",
          marginBottom: 80,
          textTransform: "uppercase",
          transform: `translateY(${interpolate(titleProgress, [0, 1], [-50, 0])}px)`,
          opacity: titleProgress,
        }}
      >
        {title}
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", flex: 1, paddingBottom: 40, borderBottom: `8px solid ${textColor}40` }}>
        {dataPoints.map((dp, i) => {
          const delay = i * 10;
          const barProgress = spring({
            frame: Math.max(0, frame - delay),
            fps,
            config: { damping: 14, stiffness: 100 },
          });

          const heightPercent = (dp.value / maxValue) * 100 * barProgress;

          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div style={{ color: textColor, fontSize: 40, fontWeight: 800, marginBottom: 20, opacity: barProgress }}>
                {Math.round(dp.value * barProgress)}
              </div>
              <div
                style={{
                  width: "60%",
                  height: `${heightPercent}%`,
                  minHeight: "1%",
                  backgroundColor: chartColor,
                  borderRadius: "20px 20px 0 0",
                  boxShadow: `0 0 30px ${chartColor}80`,
                }}
              />
              <div style={{ color: textColor, fontSize: 36, fontWeight: 800, marginTop: 30, opacity: barProgress }}>
                {dp.label}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// @ts-nocheck
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

type Word = {
  word: string;
  start: number;
  end: number;
};

export const WordCaptions: React.FC<{ words: Word[] }> = ({ words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Filter words that should be visible in the current time window
  // Hormozi style usually shows one word at a time, very fast
  const currentWord = words.find((w) => currentTime >= w.start && currentTime <= w.end);

  if (!currentWord) return null;

  // Animation: Pop-in scale
  const scale = interpolate(
    currentTime,
    [currentWord.start, currentWord.start + 0.1],
    [0.8, 1.2],
    { extrapolateRight: "clamp", easing: Easing.out(Easing.back()) }
  );

  const finalScale = interpolate(
    currentTime,
    [currentWord.start + 0.1, currentWord.start + 0.15],
    [1.2, 1],
    { extrapolateRight: "clamp" }
  );

  const colors = ["#ff0000", "#ffff00", "#00ff00", "#00ffff", "#ff00ff", "#ffffff"];
  const color = colors[Math.floor(Math.random() * colors.length)]; // Stable color per word would be better, but let's stick to white or high contrast

  return (
    <div
      style={{
        position: "absolute",
        bottom: "20%",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        zIndex: 100,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontSize: 120,
          fontWeight: 900,
          color: "white",
          textTransform: "uppercase",
          textShadow: "0 0 20px rgba(0,0,0,0.8), 0 0 40px rgba(0,0,0,0.5)",
          transform: `scale(${finalScale * scale})`,
          textAlign: "center",
          fontFamily: "Impact, sans-serif",
          padding: "0 40px",
          backgroundColor: "rgba(0,0,0,0.3)",
          borderRadius: 20,
        }}
      >
        {currentWord.word.trim()}
      </div>
    </div>
  );
};

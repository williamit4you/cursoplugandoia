// @ts-nocheck
import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

type Word = {
  word: string;
  start: number;
  end: number;
};

// Seeded random for consistent colors
function sfc32(a, b, c, d) {
  return function() {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
    var t = (a + b) | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = (c << 21 | c >>> 11);
    d = d + 1 | 0;
    t = t + d | 0;
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  }
}

export const WordCaptions: React.FC<{ words: Word[] }> = ({ words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  const currentWordIndex = words.findIndex((w) => currentTime >= w.start && currentTime <= w.end);
  const currentWord = words[currentWordIndex];

  // Map each word index to a consistent viral color
  const wordColors = useMemo(() => {
    // Viral colors: Yellow, Green, Cyan, White
    const palette = ["#ffeb3b", "#00e676", "#00e5ff", "#ffffff"];
    const colors = [];
    const rand = sfc32(1, 2, 3, 4); // Fixed seed
    
    for (let i = 0; i < words.length; i++) {
      const w = words[i].word.replace(/[^a-zA-Z]/g, '').toLowerCase();
      // Highlight long words or specific keywords
      if (w.length > 5 || ["não", "nunca", "dinheiro", "viral", "você", "segredo", "milhões"].includes(w)) {
        colors.push(palette[Math.floor(rand() * 3)]); // Pick vibrant color
      } else {
        colors.push("#ffffff"); // Default white
      }
    }
    return colors;
  }, [words]);

  if (!currentWord) return null;

  const color = wordColors[currentWordIndex] || "#ffffff";

  // Animation: Pop-in scale
  const scale = interpolate(
    currentTime,
    [currentWord.start, currentWord.start + 0.1],
    [0.5, 1.3],
    { extrapolateRight: "clamp", easing: Easing.out(Easing.back()) }
  );

  const finalScale = interpolate(
    currentTime,
    [currentWord.start + 0.1, currentWord.start + 0.2],
    [1.3, 1],
    { extrapolateRight: "clamp", easing: Easing.bezier(0.2, 0.8, 0.2, 1) }
  );

  // Rotation alternating
  const rotate = (currentWordIndex % 2 === 0 ? 1 : -1) * interpolate(
    currentTime,
    [currentWord.start, currentWord.start + 0.1],
    [10, 0],
    { extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        top: "70%",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 100,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontSize: 140,
          fontWeight: 900,
          color: color,
          textTransform: "uppercase",
          textShadow: `
            0 10px 0 #000, 
            0 -10px 0 #000, 
            10px 0 0 #000, 
            -10px 0 0 #000, 
            0 20px 40px rgba(0,0,0,0.8)
          `, // Strong Hormozi stroke and shadow
          transform: `scale(${finalScale * scale}) rotate(${rotate}deg)`,
          textAlign: "center",
          fontFamily: "Impact, sans-serif",
          lineHeight: 1,
          padding: "20px 60px",
          backgroundColor: color === "#ffffff" ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.8)",
          borderRadius: 30,
        }}
      >
        {currentWord.word.trim()}
      </div>
    </div>
  );
};

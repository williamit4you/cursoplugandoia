// @ts-nocheck
import React, { useMemo } from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

type Word = {
  word: string;
  start: number;
  end: number;
};

function cleanWord(value: string) {
  return String(value || "").trim();
}

export const WordCaptions: React.FC<{ words: Word[] }> = ({ words }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const currentTime = frame / fps;

  const currentWordIndex = words.findIndex((w) => currentTime >= w.start && currentTime <= w.end);
  const currentWord = words[currentWordIndex];

  const captionWords = useMemo(() => {
    if (!currentWord) return "";

    const group: string[] = [];
    let endTime = currentWord.end;

    for (let i = currentWordIndex; i < words.length && group.length < 4; i++) {
      const item = words[i];
      if (i !== currentWordIndex && item.start - endTime > 0.18) break;

      const word = cleanWord(item.word);
      const nextText = [...group, word].join(" ");
      if (nextText.length > 34) break;

      group.push(word);
      endTime = item.end;
      if (/[.!?]$/.test(word)) break;
    }

    return group.join(" ").trim() || cleanWord(currentWord.word);
  }, [currentWord, currentWordIndex, words]);

  if (!currentWord) return null;

  const fontSize = Math.max(46, Math.min(width * 0.07, captionWords.length > 24 ? 58 : 72));
  const scale = interpolate(currentTime, [currentWord.start, currentWord.start + 0.12], [0.96, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back()),
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: "11%",
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
          maxWidth: "84%",
          fontSize,
          fontWeight: 850,
          color: "#ffffff",
          textShadow: "0 3px 12px rgba(0,0,0,0.75)",
          transform: `scale(${scale})`,
          textAlign: "center",
          fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
          lineHeight: 1.12,
          padding: "18px 30px 20px",
          backgroundColor: "rgba(8, 13, 24, 0.72)",
          border: "1px solid rgba(255,255,255,0.16)",
          borderRadius: 18,
          boxShadow: "0 18px 48px rgba(0,0,0,0.36)",
          backdropFilter: "blur(10px)",
          overflowWrap: "break-word",
        }}
      >
        {captionWords}
      </div>
    </div>
  );
};

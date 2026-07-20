// @ts-nocheck
import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, Video, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

function isVideoUrl(url?: string | null) {
  return Boolean(url && /\.(mp4|webm|mov)(\?|$)/i.test(url));
}

function AssetLayer({ url, title, durationInFrames }: { url?: string | null; title?: string | null; durationInFrames: number }) {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, durationInFrames], [1.02, 1.08]);
  const pan = interpolate(frame, [0, durationInFrames], [-12, 12]);
  const video = isVideoUrl(url);

  if (!url) return null;

  return (
    <AbsoluteFill>
      {video ? (
        <Video
          src={url}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom}) translateX(${pan}px)` }}
        />
      ) : (
        <Img
          src={url}
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom}) translateX(${pan}px)` }}
        />
      )}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.52) 100%)" }} />
      {title ? (
        <div
          style={{
            position: "absolute",
            left: "7%",
            right: "7%",
            bottom: "10%",
            color: "#fff",
            fontSize: 58,
            fontWeight: 800,
            lineHeight: 1.02,
            textShadow: "0 8px 32px rgba(0,0,0,0.7)",
            fontFamily: "Arial Black, Arial, sans-serif",
          }}
        >
          {title}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}

export function MixedTalkingHeadVideo(props: { videoSpec: any }) {
  const { fps } = useVideoConfig();
  const segments = Array.isArray(props.videoSpec?.segments) ? props.videoSpec.segments : [];
  const talkingHeadVideoUrl = props.videoSpec?.talkingHeadVideoUrl || null;
  const audioUrl = props.videoSpec?.audioUrl || null;

  return (
    <AbsoluteFill style={{ backgroundColor: "#050816" }}>
      {audioUrl ? <Audio src={audioUrl} /> : null}

      {talkingHeadVideoUrl ? (
        <Video
          src={talkingHeadVideoUrl}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : null}

      {segments.map((segment: any) => {
        const start = Math.max(0, Math.round(Number(segment.startSec || 0) * fps));
        const end = Math.max(start + 1, Math.round(Number(segment.endSec || 0) * fps));
        const durationInFrames = end - start;
        const layout = String(segment.layout || "TALKING_HEAD_FULL");
        const assetUrl = segment.assetUrl || null;
        const title = segment.title || null;

        if (!assetUrl || layout === "TALKING_HEAD_FULL") return null;

        if (layout === "BROLL_FULL") {
          return (
            <Sequence key={segment.id} from={start} durationInFrames={durationInFrames}>
              <AssetLayer url={assetUrl} title={title} durationInFrames={durationInFrames} />
            </Sequence>
          );
        }

        return (
          <Sequence key={segment.id} from={start} durationInFrames={durationInFrames}>
            <div
              style={{
                position: "absolute",
                left: "6%",
                top: "16%",
                width: "62%",
                height: "56%",
                borderRadius: 34,
                overflow: "hidden",
                boxShadow: "0 18px 48px rgba(0,0,0,0.45)",
                border: "3px solid rgba(255,255,255,0.95)",
                background: "#000",
              }}
            >
              <AssetLayer url={assetUrl} title={null} durationInFrames={durationInFrames} />
            </div>
            {title ? (
              <div
                style={{
                  position: "absolute",
                  left: "7%",
                  right: "34%",
                  bottom: "10%",
                  color: "#fff",
                  fontSize: 56,
                  fontWeight: 800,
                  lineHeight: 1.02,
                  textShadow: "0 8px 32px rgba(0,0,0,0.7)",
                  fontFamily: "Arial Black, Arial, sans-serif",
                }}
              >
                {title}
              </div>
            ) : null}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}

// @ts-nocheck
import { Composition } from "remotion";
import { VideoFromSpec } from "./video-from-spec";
import type { VideoSpecV1 } from "./types";

const defaultSpec: VideoSpecV1 = {
  version: 1,
  meta: { aspectRatio: "9:16", fps: 30 },
  content: { title: "Vídeo", description: "", narrationText: "" },
  scenes: [
    {
      id: "s1",
      sceneTemplate: "TitleScene",
      durationSec: 3,
      props: { title: "Vídeos com código", subtitle: "Remotion" },
    },
  ],
};

function totalDurationInSeconds(spec: VideoSpecV1) {
  const scenes = spec?.scenes ?? [];
  const sum = scenes.reduce((acc, s) => acc + (Number(s.durationSec) || 0), 0);
  return Math.max(1, Math.round(sum));
}

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="VideoPortrait"
        component={VideoFromSpec}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={totalDurationInSeconds(defaultSpec) * 30}
        defaultProps={{ videoSpec: defaultSpec }}
      />
      <Composition
        id="VideoLandscape"
        component={VideoFromSpec}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={totalDurationInSeconds(defaultSpec) * 30}
        defaultProps={{ videoSpec: { ...defaultSpec, meta: { ...defaultSpec.meta, aspectRatio: "16:9" } } }}
      />
    </>
  );
}

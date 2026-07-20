// @ts-nocheck
import { Composition } from "remotion";
import { VideoFromSpec } from "./video-from-spec";
import { MixedTalkingHeadVideo } from "./mixed-talking-head-video";
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

function totalDurationInSecondsForMixed(spec: any) {
  const segments = Array.isArray(spec?.segments) ? spec.segments : [];
  const end = segments.reduce((max: number, segment: any) => Math.max(max, Number(segment?.endSec || 0)), 0);
  return Math.max(1, Math.ceil(end || Number(spec?.content?.totalDurationSec || 1)));
}

const defaultMixedSpec = {
  mode: "MIXED_TALKING_HEAD",
  meta: { aspectRatio: "9:16", fps: 30 },
  content: { narrationText: "", totalDurationSec: 6 },
  audioUrl: null,
  talkingHeadVideoUrl: null,
  segments: [
    {
      id: "m1",
      startSec: 0,
      endSec: 3,
      spokenText: "Introducao",
      layout: "TALKING_HEAD_FULL",
      assetUrl: null,
      title: null,
    },
    {
      id: "m2",
      startSec: 3,
      endSec: 6,
      spokenText: "Apoio visual",
      layout: "PIP_BOTTOM_RIGHT",
      assetUrl: null,
      title: "Apoio visual",
    },
  ],
};

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
      <Composition
        id="MixedPortrait"
        component={MixedTalkingHeadVideo}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={totalDurationInSecondsForMixed(defaultMixedSpec) * 30}
        defaultProps={{ videoSpec: defaultMixedSpec }}
      />
      <Composition
        id="MixedLandscape"
        component={MixedTalkingHeadVideo}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={totalDurationInSecondsForMixed(defaultMixedSpec) * 30}
        defaultProps={{ videoSpec: { ...defaultMixedSpec, meta: { ...defaultMixedSpec.meta, aspectRatio: "16:9" } } }}
      />
    </>
  );
}

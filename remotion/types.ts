export type VideoAspectRatio = "9:16" | "16:9";

export type VideoSpecScene =
  | {
      id: string;
      sceneTemplate: "TitleScene";
      durationSec: number;
      props: { title: string; subtitle?: string };
    }
  | {
      id: string;
      sceneTemplate: "BulletListScene";
      durationSec: number;
      props: { items: string[]; title?: string };
    }
  | {
      id: string;
      sceneTemplate: "QuoteScene";
      durationSec: number;
      props: { quote: string; author?: string };
    }
  | {
      id: string;
      sceneTemplate: "TimelineScene";
      durationSec: number;
      props: { items: { label: string; text: string }[]; title?: string };
    }
  | {
      id: string;
      sceneTemplate: "CodeTypingScene";
      durationSec: number;
      props: { code: string; language?: string; title?: string };
    };

export type VideoSpecV1 = {
  version: 1;
  meta: {
    aspectRatio: VideoAspectRatio;
    fps: number;
  };
  content: {
    title: string;
    description: string;
    narrationText: string;
  };
  scenes: VideoSpecScene[];
};


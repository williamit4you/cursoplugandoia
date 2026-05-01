export type VideoAspectRatio = "9:16" | "16:9";

export type VideoSpecScene =
  | {
      id: string;
      sceneTemplate: "TitleScene";
      durationSec: number;
      props: {
        title: string;
        subtitle?: string;
        backgroundColor?: string;
        textColor?: string;
        accentColor?: string;
        fontFamily?: string;
      };
    }
  | {
      id: string;
      sceneTemplate: "BulletListScene";
      durationSec: number;
      props: {
        items: string[];
        title?: string;
        backgroundColor?: string;
        textColor?: string;
        accentColor?: string;
        fontFamily?: string;
      };
    }
  | {
      id: string;
      sceneTemplate: "QuoteScene";
      durationSec: number;
      props: {
        quote: string;
        author?: string;
        backgroundColor?: string;
        textColor?: string;
        accentColor?: string;
        fontFamily?: string;
      };
    }
  | {
      id: string;
      sceneTemplate: "TimelineScene";
      durationSec: number;
      props: {
        items: { label: string; text: string }[];
        title?: string;
        backgroundColor?: string;
        textColor?: string;
        accentColor?: string;
        fontFamily?: string;
      };
    }
  | {
      id: string;
      sceneTemplate: "CodeTypingScene";
      durationSec: number;
      props: {
        code: string;
        language?: string;
        title?: string;
        backgroundColor?: string;
        textColor?: string;
        accentColor?: string;
        fontFamily?: string;
      };
    };

export type VideoSpecV1 = {
  version: 1;
  meta: {
    aspectRatio: VideoAspectRatio;
    fps: number;
    theme?: {
      id: string;
      name: string;
      backgroundColor: string;
      textColor: string;
      accentColor: string;
      secondaryColor: string;
      surfaceColor: string;
      fontFamily: string;
    };
  };
  content: {
    title: string;
    description: string;
    narrationText: string;
  };
  scenes: VideoSpecScene[];
};

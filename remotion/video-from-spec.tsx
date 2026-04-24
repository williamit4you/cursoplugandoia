// @ts-nocheck
import { Audio, Sequence, useVideoConfig } from "remotion";
import type { VideoSpecV1, VideoSpecScene } from "./types";
import { TitleScene } from "./scenes/TitleScene";
import { BulletListScene } from "./scenes/BulletListScene";
import { QuoteScene } from "./scenes/QuoteScene";
import { CodeTypingScene } from "./scenes/CodeTypingScene";
import { TimelineScene } from "./scenes/TimelineScene";
import { RetentionScene } from "./RetentionScene";
import { WordCaptions } from "./WordCaptions";
import { PopInOverlay } from "./PopInOverlay";

function sceneToComponent(scene: VideoSpecScene) {
  switch (scene.sceneTemplate) {
    case "TitleScene":
      return <TitleScene {...scene.props} />;
    case "BulletListScene":
      return <BulletListScene {...scene.props} />;
    case "QuoteScene":
      return <QuoteScene {...scene.props} />;
    case "CodeTypingScene":
      return <CodeTypingScene {...scene.props} />;
    case "TimelineScene":
      return <TimelineScene {...scene.props} />;
    case "RetentionScene":
      return <RetentionScene {...scene.props} durationInFrames={scene.durationInFrames} />;
    default:
      return <TitleScene title="Cena inválida" subtitle="Template não suportado" />;
  }
}

export function VideoFromSpec(props: { 
  videoSpec: VideoSpecV1; 
  audioUrl?: string | null;
  transcription?: any[] | null;
}) {
  const { fps } = useVideoConfig();
  const scenes = props.videoSpec?.scenes ?? [];

  let from = 0;
  return (
    <div style={{ flex: 1, backgroundColor: 'black' }}>
      {props.audioUrl ? <Audio src={props.audioUrl} /> : null}
      
      {scenes.map((scene) => {
        const durationInFrames = Math.max(1, Math.round((scene.durationSec ?? 1) * fps));
        scene.durationInFrames = durationInFrames; // Inject for RetentionScene
        
        const node = (
          <Sequence key={scene.id} from={from} durationInFrames={durationInFrames}>
            {sceneToComponent(scene)}
            {scene.props?.overlays && <PopInOverlay overlays={scene.props.overlays} />}
          </Sequence>
        );
        from += durationInFrames;
        return node;
      })}

      {props.transcription && <WordCaptions words={props.transcription} />}
    </div>
  );
}

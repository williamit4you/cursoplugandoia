import "server-only";

export type CreatorVideoAudioSettings = {
  language: "Portuguese" | "English";
  speechRate: number;
  maxNewTokens: number;
  topP: number;
  topK: number;
  temperature: number;
  repetitionPenalty: number;
  quality: "V0" | "V2" | "320k";
};

export type CreatorVideoRenderSettings = {
  formatPreset: "TIKTOK" | "INSTAGRAM_REEL";
  width: number;
  height: number;
  fps: number;
  steps: number;
  cfg: number;
  shift: number;
  crf: number;
};

export function defaultCreatorVideoAudioSettings(): CreatorVideoAudioSettings {
  return {
    language: "Portuguese",
    speechRate: 1,
    maxNewTokens: 2048,
    topP: 0.8,
    topK: 20,
    temperature: 1,
    repetitionPenalty: 1.05,
    quality: "V0",
  };
}

export function defaultCreatorVideoRenderSettings(): CreatorVideoRenderSettings {
  return {
    formatPreset: "TIKTOK",
    width: 432,
    height: 768,
    fps: 25,
    steps: 4,
    cfg: 1,
    shift: 11,
    crf: 19,
  };
}

export function creatorVideoFormatPresetOptions() {
  return [
    { value: "TIKTOK", label: "TikTok 9:16", width: 432, height: 768 },
    { value: "INSTAGRAM_REEL", label: "Instagram Reel 9:16", width: 432, height: 768 },
  ] as const;
}

export function creatorVideoObservedComfyParams() {
  return {
    audio: {
      node: "FB_Qwen3TTSVoiceClone",
      modelChoice: "1.7B",
      device: "auto",
      precision: "bf16",
      attention: "auto",
      xVectorOnly: true,
      unloadModelAfterGenerate: false,
      adjustableFields: [
        "language",
        "speechRate",
        "maxNewTokens",
        "topP",
        "topK",
        "temperature",
        "repetitionPenalty",
        "quality",
        "seed",
      ],
    },
    video: {
      workflow: "Infinite Talk / WanVideo",
      adjustableFields: [
        "width",
        "height",
        "fps",
        "steps",
        "cfg",
        "shift",
        "crf",
        "seed",
      ],
      fixedNodes: {
        multitalkModel: "Wan2_1-InfiniteTalk_Single_Q6_K.gguf",
        videoModel: "wan2.1-i2v-14b-480p-Q4_K_S.gguf",
        vae: "wan_2.1_vae.safetensors",
        textEncoder: "umt5-xxl-enc-fp8_e4m3fn.safetensors",
        clipVision: "clip_vision_h.safetensors",
      },
    },
    expectedDurations: {
      audioSeconds: [120, 600],
      videoSeconds: [600, 3600],
    },
  };
}

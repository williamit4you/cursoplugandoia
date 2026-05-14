import "server-only";

export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function replacePlaceholders<T>(obj: T, replacements: Record<string, string | number>): T {
  const json = JSON.stringify(obj);
  const replaced = Object.entries(replacements).reduce((acc, [key, val]) => {
    return acc.split(key).join(String(val));
  }, json);
  return JSON.parse(replaced) as T;
}

function isObject(value: unknown): value is Record<string, any> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function promptNodes(prompt: unknown): Array<Record<string, any>> {
  if (!isObject(prompt)) return [];
  return Object.values(prompt).filter((node) => isObject(node) && isObject(node.inputs)) as Array<Record<string, any>>;
}

export function isComfyPromptApiTemplate(value: unknown) {
  return promptNodes(value).some((node) => typeof node.class_type === "string");
}

export function isComfyUiWorkflowTemplate(value: unknown) {
  return isObject(value) && Array.isArray(value.nodes) && Array.isArray(value.links);
}

export function forceAudioPromptInputs<T>(prompt: T, params: { voiceRefFilename: string; targetText: string; outputPrefix: string; seed: number }): T {
  for (const node of promptNodes(prompt)) {
    const classType = String(node.class_type || "");
    if (classType === "LoadAudio") {
      node.inputs.audio = params.voiceRefFilename;
      delete node.inputs.audioUI;
    }

    if (classType === "FB_Qwen3TTSVoiceClone") {
      node.inputs.target_text = params.targetText;
      node.inputs.seed = params.seed;
    }

    if (classType === "SaveAudioMP3") {
      node.inputs.filename_prefix = params.outputPrefix;
      delete node.inputs.audioUI;
    }
  }
  return prompt;
}

export function forceVideoPromptInputs<T>(prompt: T, params: { imageFilename: string; audioFilename: string; outputPrefix: string; seed: number }): T {
  for (const node of promptNodes(prompt)) {
    const classType = String(node.class_type || "");
    if (classType === "LoadImage") {
      node.inputs.image = params.imageFilename;
      delete node.inputs.upload;
    }

    if (classType === "LoadAudio") {
      node.inputs.audio = params.audioFilename;
      delete node.inputs.audioUI;
    }

    if (classType === "VHS_VideoCombine") {
      node.inputs.filename_prefix = params.outputPrefix;
    }

    if (classType === "WanVideoSampler") {
      node.inputs.seed = params.seed;
    }
  }
  return prompt;
}

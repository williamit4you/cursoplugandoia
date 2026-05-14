import "server-only";

import audioTemplate from "@/lib/shopee-pipeline/comfyui/templates/audio-voiceclone.json";
import { replacePlaceholders, deepClone } from "@/lib/shopee-pipeline/comfyui/templates";
import { comfyDownloadView, comfySubmitPrompt, comfyUploadInput, comfyWaitForPrompt, type ComfyUiFileRef, ComfyUiHttpError } from "@/lib/shopee-pipeline/comfyui/client";

export async function generateVoiceCloneAudio(params: {
  targetText: string;
  voiceRefBuffer: Buffer;
  voiceRefFilename: string;
  voiceRefContentType: string;
  outputPrefix: string;
  seed: number;
  timeoutMs: number;
  promptTemplateOverride?: any;
}) {
  const upload = await comfyUploadInput({
    buffer: params.voiceRefBuffer,
    filename: params.voiceRefFilename,
    contentType: params.voiceRefContentType,
  });

  const template = params.promptTemplateOverride || (audioTemplate as any);
  const prompt = replacePlaceholders(deepClone(template), {
    "__VOICE_REF_FILENAME__": upload.name,
    "__TARGET_TEXT__": params.targetText,
    "__OUTPUT_PREFIX__": params.outputPrefix,
    "__SEED__": params.seed,
  });

  let submit: any;
  try {
    submit = await comfySubmitPrompt(prompt, 20000);
  } catch (error: any) {
    if (error instanceof ComfyUiHttpError) {
      (error as any).details = { stage: "submitPrompt", upload: { name: upload.name, raw: upload.raw }, http: { request: error.request, response: error.response } };
    }
    throw error;
  }
  const promptId = String(submit?.prompt_id || "");
  if (!promptId) throw new Error("ComfyUI did not return prompt_id");

  const done = await comfyWaitForPrompt({ promptId, timeoutMs: params.timeoutMs, pollMs: 5000 });
  const files = done.files;

  const mp3 = files.find((f) => f.filename.toLowerCase().endsWith(".mp3")) || files[0];
  if (!mp3) throw new Error("ComfyUI returned no output files");

  const downloaded = await comfyDownloadView(mp3 as ComfyUiFileRef, 30000);
  return {
    promptId,
    prompt,
    history: done.history,
    files,
    file: mp3,
    buffer: downloaded.buffer,
    contentType: downloaded.contentType,
  };
}

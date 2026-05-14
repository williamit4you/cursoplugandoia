import "server-only";

import { forceVideoPromptInputs, isComfyPromptApiTemplate, isComfyUiWorkflowTemplate, replacePlaceholders, deepClone } from "@/lib/shopee-pipeline/comfyui/templates";
import { comfyDownloadView, comfySubmitPrompt, comfyUploadInput, comfyWaitForPrompt, type ComfyUiFileRef, ComfyUiHttpError } from "@/lib/shopee-pipeline/comfyui/client";

export async function generateVideoFromTemplate(params: {
  template: any;
  replacements: Record<string, string | number>;
  inputFiles: Array<{ buffer: Buffer; filename: string; contentType: string; placeholderKey: string }>;
  timeoutMs: number;
}) {
  const uploaded: Record<string, string> = {};
  const uploadMeta: any[] = [];

  for (const file of params.inputFiles) {
    const up = await comfyUploadInput({ buffer: file.buffer, filename: file.filename, contentType: file.contentType });
    uploaded[file.placeholderKey] = up.name;
    uploadMeta.push({ placeholderKey: file.placeholderKey, name: up.name, raw: up.raw });
  }

  if (isComfyUiWorkflowTemplate(params.template)) {
    throw new Error("ComfyUI Video Template esta em formato Workflow/UI. Use Export (API) / Save (API Format) no ComfyUI para o campo de video.");
  }
  if (!isComfyPromptApiTemplate(params.template)) {
    throw new Error("ComfyUI Video Template invalido: esperado prompt API com nodes { class_type, inputs }.");
  }

  const prompt = forceVideoPromptInputs(replacePlaceholders(deepClone(params.template), { ...params.replacements, ...uploaded }), {
    imageFilename: uploaded.__IMG_FILENAME__,
    audioFilename: uploaded.__AUDIO_FILENAME__,
    outputPrefix: String(params.replacements.__OUTPUT_PREFIX__ || ""),
    seed: Number(params.replacements.__SEED__ || 0),
  });
  let submit: any;
  try {
    submit = await comfySubmitPrompt(prompt, 20000);
  } catch (error: any) {
    if (error instanceof ComfyUiHttpError) {
      (error as any).details = { stage: "submitPrompt", uploadMeta, http: { request: error.request, response: error.response } };
    }
    throw error;
  }
  const promptId = String(submit?.prompt_id || "");
  if (!promptId) throw new Error("ComfyUI did not return prompt_id");

  const done = await comfyWaitForPrompt({ promptId, timeoutMs: params.timeoutMs, pollMs: 5000 });
  const files = done.files;
  const mp4 = files.find((f) => f.filename.toLowerCase().endsWith(".mp4")) || files[0];
  if (!mp4) throw new Error("ComfyUI returned no output files");

  const downloaded = await comfyDownloadView(mp4 as ComfyUiFileRef, 60000);
  return {
    promptId,
    prompt,
    history: done.history,
    files,
    file: mp4,
    buffer: downloaded.buffer,
    contentType: downloaded.contentType,
    uploadMeta,
  };
}

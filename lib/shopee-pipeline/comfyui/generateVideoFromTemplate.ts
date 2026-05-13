import "server-only";

import { replacePlaceholders, deepClone } from "@/lib/shopee-pipeline/comfyui/templates";
import { comfyDownloadView, comfySubmitPrompt, comfyUploadInput, comfyWaitForPrompt, type ComfyUiFileRef } from "@/lib/shopee-pipeline/comfyui/client";

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

  const prompt = replacePlaceholders(deepClone(params.template), { ...params.replacements, ...uploaded });
  const submit = await comfySubmitPrompt(prompt, 20000);
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

export const LIMPEZA_VIDEO_LOGIN_PATH = "/limpezavideo/login";
export const LIMPEZA_VIDEO_HOME_PATH = "/limpezavideo";
export const LIMPEZA_VIDEO_ALLOWED_AUDIO_MODES = ["PRESERVE", "REDUCE", "MUTE"] as const;

export const LIMPEZA_VIDEO_STEP_PROGRESS: Record<string, number> = {
  UPLOAD_ORIGINAL: 10,
  PROBE_INPUT: 20,
  PROCESS_VIDEO: 70,
  UPLOAD_OUTPUT: 90,
  COMPLETE: 100,
};

export const LIMPEZA_VIDEO_DEFAULT_INSTAGRAM = "@compraesperta.promocoes";
export const LIMPEZA_VIDEO_DEFAULT_ENDCARD_SEC = 2;

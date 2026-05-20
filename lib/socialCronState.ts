import "server-only";

export type SocialCronSnapshot = {
  running: boolean;
  runningSince: string | null;
  lastStartedAt: string | null;
  lastFinishedAt: string | null;
  lastOk: boolean | null;
  lastChecked: number | null;
  lastResults: any[] | null;
  lastErrorMessage: string | null;
};

const state: SocialCronSnapshot = {
  running: false,
  runningSince: null,
  lastStartedAt: null,
  lastFinishedAt: null,
  lastOk: null,
  lastChecked: null,
  lastResults: null,
  lastErrorMessage: null,
};

export function getSocialCronState(): SocialCronSnapshot {
  return { ...state, lastResults: state.lastResults ? [...state.lastResults] : null };
}

export function markSocialCronRunning(at = new Date(), preview?: { checked?: number | null }) {
  state.running = true;
  state.runningSince = at.toISOString();
  state.lastStartedAt = at.toISOString();
  state.lastErrorMessage = null;
  if (typeof preview?.checked === "number") state.lastChecked = preview.checked;
}

export function markSocialCronFinished(params: {
  ok: boolean;
  checked: number;
  results: any[];
  finishedAt?: Date;
}) {
  const finishedAt = params.finishedAt || new Date();
  state.running = false;
  state.runningSince = null;
  state.lastFinishedAt = finishedAt.toISOString();
  state.lastOk = Boolean(params.ok);
  state.lastChecked = Number(params.checked || 0);
  // Keep it small: persist only first 50 entries.
  state.lastResults = Array.isArray(params.results) ? params.results.slice(0, 50) : [];
  state.lastErrorMessage = null;
}

export function markSocialCronError(errorMessage: string, finishedAt = new Date()) {
  state.running = false;
  state.runningSince = null;
  state.lastFinishedAt = finishedAt.toISOString();
  state.lastOk = false;
  state.lastErrorMessage = errorMessage;
}


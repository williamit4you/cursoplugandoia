import "server-only";

export type ShopeeStepStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCESS"
  | "FAILED"
  | "RETRY_SCHEDULED"
  | "SKIPPED";

export type RetryDecision = {
  retry: boolean;
  nextRetryAt: Date | null;
  errorMessage?: string | null;
  errorCode?: string | null;
};

export type StepContext = {
  coletaId: string;
  runnerId: string;
  now: Date;
};

export type StepResult = {
  ok: boolean;
  nextStatus?: string;
  requestPayload?: unknown;
  responsePayload?: unknown;
  message?: string;
};

export interface PipelineStep {
  name: string;
  canRun(context: StepContext): Promise<boolean>;
  run(context: StepContext): Promise<StepResult>;
  onFailure(error: unknown, context: StepContext): Promise<RetryDecision>;
}


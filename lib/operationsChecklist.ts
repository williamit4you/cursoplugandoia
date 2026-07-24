export type DailyChecklistAlert = {
  severity?: string | null;
};

export type DailyChecklistIntegration = {
  platform: string;
  isActive: boolean;
};

export type DailyChecklistSnapshot = {
  alerts: DailyChecklistAlert[];
  overdueSocial: number;
  staleOperations: string[];
  integrations: DailyChecklistIntegration[];
  videosWithoutPublication: number;
  articlesWithoutVisits: number;
  socialFailed: number;
};

export type OperationRunHeartbeat = {
  heartbeatAt: Date;
};

export type OperationDefinitionHeartbeat = {
  key: string;
  expectedEverySec?: number | null;
  runs: OperationRunHeartbeat[];
};

export function listStaleOperations(definitions: OperationDefinitionHeartbeat[], now = new Date()) {
  return definitions
    .filter((definition) => {
      const run = definition.runs[0];
      const threshold = Math.max(300, Number(definition.expectedEverySec || 300) * 3) * 1000;
      return !run || now.getTime() - run.heartbeatAt.getTime() > threshold;
    })
    .map((item) => item.key);
}

export function buildDailyChecklist(snapshot: DailyChecklistSnapshot) {
  return {
    noCriticalAlerts: !snapshot.alerts.some((item) => item.severity === "CRITICAL"),
    noOverdueQueue: snapshot.overdueSocial === 0,
    freshHeartbeats: snapshot.staleOperations.length === 0,
    integrationsActive: snapshot.integrations.length > 0 && snapshot.integrations.every((item) => item.isActive),
    videosAccountedFor: snapshot.videosWithoutPublication === 0,
    articlesReceivingVisits: snapshot.articlesWithoutVisits === 0,
    failuresReviewed: snapshot.socialFailed === 0,
  };
}

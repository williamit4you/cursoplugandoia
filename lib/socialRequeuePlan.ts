export const REQUEUE_SPACING_HOURS = 2;

export type SocialRequeueCandidate = {
  id: string;
  platform: string;
  log?: string | null;
};

export type SocialRequeueFutureSlot = {
  platform: string;
  scheduledTo: Date | null;
};

export type SocialRequeuePlanItem = {
  item: SocialRequeueCandidate;
  scheduledTo: Date;
};

export function buildSocialRequeuePlan(params: {
  now: Date;
  candidates: SocialRequeueCandidate[];
  futureSlots: SocialRequeueFutureSlot[];
  spacingHours?: number;
}) {
  const spacingHours = params.spacingHours ?? REQUEUE_SPACING_HOURS;
  const spacingMs = spacingHours * 60 * 60 * 1000;
  const occupiedSlots = new Set<string>();

  for (const future of params.futureSlots) {
    if (!future.scheduledTo) continue;
    occupiedSlots.add(`${future.platform}:${future.scheduledTo.getTime()}`);
  }

  let cursor = new Date(params.now.getTime() + spacingMs);

  return params.candidates.map((item) => {
    while (occupiedSlots.has(`${item.platform}:${cursor.getTime()}`)) {
      cursor = new Date(cursor.getTime() + spacingMs);
    }

    const scheduledTo = new Date(cursor);
    occupiedSlots.add(`${item.platform}:${scheduledTo.getTime()}`);
    cursor = new Date(cursor.getTime() + spacingMs);

    return { item, scheduledTo };
  });
}

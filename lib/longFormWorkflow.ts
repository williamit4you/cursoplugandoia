import "server-only";

import type { LongFormMetadata } from "@/lib/longFormMarketing";
import { requireServerSession } from "@/lib/serverAuth";

type ApprovalActor = {
  id: string | null;
  label: string;
};

export async function getLongFormApprovalActor(): Promise<ApprovalActor> {
  const session = await requireServerSession().catch(() => null);
  const user = session?.user as any;
  const id = String(user?.id || "").trim() || null;
  const label = String(user?.name || user?.email || user?.id || "admin")
    .trim()
    .slice(0, 120);
  return { id, label: label || "admin" };
}

export function markPlanningApproved(
  metadata: LongFormMetadata,
  actor: ApprovalActor,
) {
  return {
    ...metadata,
    planningApproved: true,
    planningApprovedAt: new Date().toISOString(),
    planningApprovedBy: actor.label,
  } satisfies LongFormMetadata;
}

export function markFinalApproved(
  metadata: LongFormMetadata,
  actor: ApprovalActor,
) {
  return {
    ...metadata,
    finalApproved: true,
    finalApprovedAt: new Date().toISOString(),
    finalApprovedBy: actor.label,
  } satisfies LongFormMetadata;
}

export function clearPlanningApproval(metadata: LongFormMetadata) {
  return {
    ...metadata,
    planningApproved: false,
    planningApprovedAt: null,
    planningApprovedBy: null,
    finalApproved: false,
    finalApprovedAt: null,
    finalApprovedBy: null,
  } satisfies LongFormMetadata;
}

export function clearFinalApproval(metadata: LongFormMetadata) {
  return {
    ...metadata,
    finalApproved: false,
    finalApprovedAt: null,
    finalApprovedBy: null,
  } satisfies LongFormMetadata;
}

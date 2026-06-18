import "server-only";

import { NextRequest } from "next/server";

import { POST as generateVideoForPostRoute } from "@/app/api/posts/[id]/generate-video/route";

type TriggerNewsVideoParams = {
  baseUrl: string;
  postId: string;
  trigger: string;
};

export async function triggerNewsVideoGenerationForPost(params: TriggerNewsVideoParams) {
  const req = new NextRequest(new URL(`/api/posts/${params.postId}/generate-video`, params.baseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trigger: params.trigger }),
  });

  const res = await generateVideoForPostRoute(req, { params: { id: params.postId } });
  const data = await res.json().catch(() => ({}));

  return {
    ok: res.ok,
    status: res.status,
    data,
  };
}

/**
 * lib/linkedinApi.ts
 *
 * LinkedIn UGC Posts API v2
 * Docs: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/ugc-post-api
 *
 * Requer access_token com escopos:
 *   - w_member_social   (publicar como pessoa física)
 *   - w_organization_social (publicar como empresa — precisa orgUrn)
 */

export interface LinkedInPostParams {
  text: string;
  title: string;
  imageUrl?: string;
  articleUrl?: string;
  accessToken: string;
  personUrn: string;   // ex: "urn:li:person:ABC123"
  orgUrn?: string;     // ex: "urn:li:organization:12345" (opcional)
}

export async function publishLinkedInPost(params: LinkedInPostParams): Promise<string> {
  const authorUrn = params.orgUrn || params.personUrn;

  // Texto enriquecido: summary + link do artigo se disponível
  const textContent = params.articleUrl
    ? `${params.text}\n\n🔗 Leia o artigo completo: ${params.articleUrl}`
    : params.text;

  const body: any = {
    author: authorUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: textContent },
        shareMediaCategory: params.imageUrl ? "IMAGE" : "NONE",
        ...(params.imageUrl
          ? {
              media: [
                {
                  status: "READY",
                  description: { text: params.title },
                  media: params.imageUrl,
                  title: { text: params.title },
                },
              ],
            }
          : {}),
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.accessToken}`,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`LinkedIn API error (${res.status}): ${data.message || JSON.stringify(data)}`);
  }

  return data.id;
}

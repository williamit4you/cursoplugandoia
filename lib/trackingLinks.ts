export function withCampaignTracking(rawUrl: string, values: { source: string; medium: string; campaign: string; content?: string }) {
  try {
    const url = new URL(rawUrl);
    url.searchParams.set("utm_source", values.source);
    url.searchParams.set("utm_medium", values.medium);
    url.searchParams.set("utm_campaign", values.campaign);
    if (values.content) url.searchParams.set("utm_content", values.content);
    return url.toString();
  } catch {
    return rawUrl;
  }
}

import "server-only";

export function parseProjectMetadata(text: string | null | undefined) {
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

export function isNewsVideoProject(project: { metadataJson?: string | null }) {
  const metadata = parseProjectMetadata(project.metadataJson);
  return Boolean(metadata?.newsAutomation || metadata?.postId);
}

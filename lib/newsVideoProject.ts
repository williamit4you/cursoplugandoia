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

export function isNewsAutoPresenterVideoEnabled() {
  const raw = String(process.env.NEWS_ARTICLE_AUTO_PRESENTER_VIDEO_ENABLED || "").trim().toLowerCase();
  if (!raw) return false;
  return raw !== "false" && raw !== "0" && raw !== "off";
}

export async function resolveNewsAutoPresenterVideoEnabled(db?: {
  integrationSettings?: {
    findUnique: (args: { where: { platform: string }; select: { isActive: true } }) => Promise<{ isActive: boolean } | null>;
  };
}) {
  try {
    const setting = await db?.integrationSettings?.findUnique({
      where: { platform: "NEWS_AUTOMATION" },
      select: { isActive: true },
    });
    if (setting) return Boolean(setting.isActive);
  } catch {
    // Fallback seguro para env quando a tabela ainda nao estiver acessivel.
  }

  return isNewsAutoPresenterVideoEnabled();
}

export function isNewsPresenterProject(project: { metadataJson?: string | null; newsVariant?: string | null }) {
  if (!isNewsVideoProject(project)) return false;
  const metadata = parseProjectMetadata(project.metadataJson);
  const variant = String(metadata?.newsVariant || project.newsVariant || "PRESENTER").toUpperCase();
  return variant !== "BROLL";
}

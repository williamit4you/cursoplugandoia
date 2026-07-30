import "server-only";
import { prisma } from "@/lib/prisma";
import { searchPexelsMedia } from "@/lib/pexels";
import { uploadBufferToMinio } from "@/lib/shopee-pipeline/minioUpload";
import { computeNextSocialQueueTime } from "@/lib/socialQueueSchedule";

export const LONG_FORM_PROJECT_TYPE = "LONG_FORM_MARKETING";
export const LONG_FORM_MODEL = process.env.LONG_FORM_MARKETING_MODEL || "gpt-4o-mini";
export const LONG_FORM_TARGET_DURATION_SEC = 600;
export const LONG_FORM_MIN_DURATION_SEC = 300;
export type LongFormMetadata = { kind: "LONG_FORM_MARKETING"; funnelStage: "TOPO" | "MEIO" | "FUNDO"; subtopics: string[]; audience?: string; objective?: string; cta?: string; tone?: string; externalMediaPolicy?: "PEXELS_AND_UPLOADS" | "UPLOADS_ONLY"; youtubeTags?: string[]; titleOptions?: string[]; chapters?: Array<{ title: string; startSec: number }>; thumbnailConcepts?: Array<{ title: string; text: string; visual: string }>; thumbnailOptions?: Array<{ title: string; url: string }>; subtopicCoverage?: Array<{ subtopic: string; explanation: string }>; selectedTitle?: string; estimatedCostUsd?: number; actualCostUsd?: number | null; actualDurationSec?: number | null; planningApproved?: boolean; finalApproved?: boolean; scheduledSocialPostId?: string; assetCredits?: Array<{ url: string; source: string; query: string }> };
export function parseLongFormMetadata(value: string | null | undefined): LongFormMetadata { try { const raw = JSON.parse(value || "{}"); return raw?.kind === "LONG_FORM_MARKETING" ? raw : ({} as LongFormMetadata); } catch { return {} as LongFormMetadata; } }
export const LONG_FORM_MAX_SUBTOPICS = 50;

export function normalizeSubtopics(value: unknown) {
  return Array.from(
    new Set(
      (Array.isArray(value) ? value : [])
        .map((item) => String(item || "").trim())
        .filter(Boolean),
    ),
  ).slice(0, LONG_FORM_MAX_SUBTOPICS);
}
export function durationFromVideoSpec(value: string | null | undefined) {
  try {
    const spec = JSON.parse(value || "{}");
    const scenes = Array.isArray(spec?.scenes) ? spec.scenes : [];
    return scenes.reduce((total: number, scene: any) => total + Math.max(0, Number(scene?.durationSec) || 0), 0);
  } catch {
    return 0;
  }
}
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function lines(text: string) { const out: string[] = []; let current = ""; for (const word of text.split(/\s+/)) { if (`${current} ${word}`.trim().length > 23 && current) { out.push(current); current = word; } else current = `${current} ${word}`.trim(); } if (current) out.push(current); return out.slice(0, 3); }
export async function createFreeThumbnail(id: string, title: string, meta: LongFormMetadata, variant = "selected") { const words = lines(title || "Marketing digital sem enrolacao"); const headline = words.map((line, i) => `<text x="100" y="${260 + i * 125}" fill="#fff" font-family="Arial Black,Arial" font-size="92" font-weight="900">${esc(line)}</text>`).join(""); const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="#080808"/><rect width="38" height="720" fill="#dc2626"/><circle cx="1110" cy="120" r="170" fill="#dc2626"/><circle cx="1180" cy="620" r="280" fill="#991b1b" opacity=".35"/><text x="100" y="112" fill="#fca5a5" font-family="Arial" font-size="30" font-weight="700" letter-spacing="4">MARKETING DIGITAL • ${meta.funnelStage || "TOPO"}</text>${headline}<rect x="100" y="615" width="315" height="62" rx="31" fill="#dc2626"/><text x="130" y="656" fill="#fff" font-family="Arial" font-size="29" font-weight="700">PLUGANDO IA</text></svg>`; return uploadBufferToMinio({ buffer: Buffer.from(svg), key: `long-form-marketing/thumbnails/${id}-${variant}.svg`, contentType: "image/svg+xml" }); }
export async function findPexelsAssets(queries: string[], enabled: boolean) { if (!enabled) return []; const results = await Promise.all(queries.slice(0, 12).map(async (query) => ({ query, assets: await searchPexelsMedia(query, 1, "landscape") }))); return results.flatMap(({ query, assets }) => assets.map((asset) => ({ url: asset.url, source: "Pexels", query }))); }
export async function enqueueLongFormYoutube(project: { id: string; title: string | null; description: string | null; videoUrl: string | null; thumbUrl: string | null; metadataJson: string }) { if (!project.videoUrl) throw new Error("Renderize o video antes de agendar."); const meta = parseLongFormMetadata(project.metadataJson); if (!meta.finalApproved) throw new Error("Aprovacao final obrigatoria antes do agendamento."); const existing = await prisma.socialPost.findFirst({ where: { codeVideoProjectId: project.id, platform: "YOUTUBE", status: { in: ["SCHEDULED", "PUBLISHING", "POSTED"] } } }); if (existing) return existing; const scheduledTo = await computeNextSocialQueueTime({ platform: "YOUTUBE", desiredAt: new Date(), spacingHours: 24 }); const social = await prisma.socialPost.create({ data: { codeVideoProjectId: project.id, title: project.title, summary: `${project.description || ""}${meta.youtubeTags?.length ? `\n\nTags: ${meta.youtubeTags.join(", ")}` : ""}`.slice(0, 4500), videoUrl: project.videoUrl, thumbUrl: project.thumbUrl, platform: "YOUTUBE", postType: "VIDEO", status: "SCHEDULED", scheduledTo, log: `[${new Date().toLocaleTimeString("pt-BR")}] Video longo agendado com intervalo de 24 horas.` } }); await prisma.codeVideoProject.update({ where: { id: project.id }, data: { metadataJson: JSON.stringify({ ...meta, scheduledSocialPostId: social.id }) } }); return social; }

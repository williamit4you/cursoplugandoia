import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

function safeJsonParse(text: string | null) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default async function PublicVideoViewerPage({ params }: { params: { id: string } }) {
  const socialPostId = String(params.id || "").trim();
  if (!socialPostId) notFound();

  const socialPost = await prisma.socialPost.findUnique({
    where: { id: socialPostId },
    include: {
      codeVideoProject: true,
    },
  });

  if (!socialPost) notFound();

  // Try to resolve a destination URL just in case the user wants to buy/click
  let ctaUrl = "";
  let ctaText = "Acessar Oferta / Conteúdo";

  if (socialPost.codeVideoProject) {
    const metadata = safeJsonParse(socialPost.codeVideoProject.metadataJson);
    ctaUrl =
      metadata?.productUrl ||
      metadata?.affiliateUrl ||
      metadata?.shopee?.affiliateUrl ||
      metadata?.mercadoLivre?.affiliateUrl ||
      "";

    if (!ctaUrl) {
      const bundle = await prisma.automationAssetBundle.findFirst({
        where: { codeVideoProjectId: socialPost.codeVideoProject.id },
      });
      ctaUrl = bundle?.affiliateUrl || bundle?.productUrl || "";
    }
  }

  if (!ctaUrl) {
    const pub = await prisma.storyPublication.findFirst({
      where: {
        responsePayload: {
          path: ["socialPostId"],
          equals: socialPost.id,
        },
      },
      include: {
        storyAd: {
          include: {
            coleta: true,
          },
        },
      },
    });

    if (pub?.storyAd) {
      ctaUrl = pub.storyAd.affiliateUrl || pub.storyAd.coleta?.affiliateUrl || "";
    }
  }

  if (!ctaUrl && socialPost.summary) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = socialPost.summary.match(urlRegex);
    if (matches && matches.length > 0) {
      ctaUrl = matches[0];
    }
  }

  const title = socialPost.codeVideoProject?.title || "Vídeo PlugandoIA";
  const desc = socialPost.codeVideoProject?.description || socialPost.summary || "";

  return (
    <main className="mx-auto max-w-xl px-4 py-8 flex flex-col items-center min-h-screen justify-between">
      <div className="w-full flex items-center justify-between border-b border-white/10 pb-4 mb-6">
        <Link href="/" className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
          PlugandoIA
        </Link>
        <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 uppercase tracking-widest font-semibold">
          {socialPost.platform}
        </span>
      </div>

      <div className="w-full flex-grow flex flex-col items-center justify-center">
        {/* Video Player - constrained for 9:16 format */}
        <div className="w-full max-w-[360px] aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative group">
          {socialPost.videoUrl ? (
            <video
              src={socialPost.videoUrl}
              controls
              playsInline
              className="w-full h-full object-cover"
              poster={socialPost.thumbUrl || undefined}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <svg className="w-12 h-12 mb-3 text-slate-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-semibold">Vídeo em processamento</p>
              <p className="text-xs text-slate-600 mt-1">O link estará disponível em breve</p>
            </div>
          )}
        </div>

        {/* Video Info Card */}
        <div className="w-full mt-6 bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl">
          <h1 className="text-lg font-bold text-slate-100">{title}</h1>
          <p className="mt-2 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
            {desc}
          </p>

          {ctaUrl && (
            <div className="mt-5">
              <a
                href={`/p/${socialPostId}`}
                className="w-full block text-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold px-5 py-3.5 hover:shadow-lg hover:shadow-emerald-500/20 transform hover:-translate-y-0.5 active:translate-y-0 transition duration-150"
              >
                {ctaText}
              </a>
            </div>
          )}
        </div>
      </div>

      <footer className="mt-12 text-center text-xs text-slate-500 w-full border-t border-white/5 pt-6">
        <div>© {new Date().getFullYear()} PlugandoIA. Todos os direitos reservados.</div>
      </footer>
    </main>
  );
}

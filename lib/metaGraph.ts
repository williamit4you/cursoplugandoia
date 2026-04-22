// lib/metaGraph.ts
export async function getMetaAccounts(accessToken: string) {
  try {
    // 1. Tenta listar as páginas (Contas de Desenvolvedor / User Token)
    const res = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=name,id,instagram_business_account&access_token=${accessToken}`);
    const data = await res.json();
    
    let accounts: any[] = [];

    if (data.data && data.data.length > 0) {
        accounts = data.data.map((acc: any) => ({
            name: `${acc.name} (Página)`,
            pageId: acc.id,
            instagramId: acc.instagram_business_account?.id || "N/A",
            type: "PAGE"
        }));
    }

    // 2. Tenta pegar a própria conta (Caso seja um Page Token direto ou User ID)
    const resMe = await fetch(`https://graph.facebook.com/v19.0/me?fields=name,id,instagram_business_account&access_token=${accessToken}`);
    const dataMe = await resMe.json();
    
    if (!dataMe.error) {
        accounts.push({
            name: `${dataMe.name} (Perfil/Token Ativo)`,
            pageId: dataMe.id,
            instagramId: dataMe.instagram_business_account?.id || "N/A",
            type: "ME"
        });
    }

    if (accounts.length === 0 && data.error) {
        throw new Error(data.error.message);
    }

    return accounts;
  } catch (err: any) {
    throw new Error(err.message || 'Meta API Error');
  }
}
export async function getInstagramAccountId(pageId: string, accessToken: string) {
  const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`);
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message || 'Failed to get IG Account');
  }
  return data.instagram_business_account?.id || null;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ─── STORY 24H: Cria container para Story de 24h no Instagram ────────────────
export async function createInstagramStoryContainer(
  videoUrl: string,
  instagramId: string,
  accessToken: string
): Promise<string> {
  const res = await fetch(`https://graph.facebook.com/v19.0/${instagramId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media_type: "STORIES",
      video_url: videoUrl,
      access_token: accessToken,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "Erro criando container Story IG");
  return data.id;
}

// ─── STORY 24H: Publica Story de 24h na Página do Facebook ──────────────────
export async function publishFacebookStory24h(
  videoUrl: string,
  pageId: string,
  accessToken: string
): Promise<string> {
  const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/video_stories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file_url: videoUrl,
      upload_phase: "finish",
      access_token: accessToken,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "Erro publicando Story no Facebook");
  return data.video_id || data.id;
}



// ─── FASE 1: Cria o container e retorna o ID imediatamente ───────────────────
export async function createInstagramContainer(
  videoUrl: string,
  instagramId: string,
  accessToken: string
): Promise<string> {
  const res = await fetch(`https://graph.facebook.com/v19.0/${instagramId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media_type: "REELS",
      video_url: videoUrl,
      access_token: accessToken,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "Erro criando container IG");
  return data.id; // creationId
}

// ─── FASE 2: Checa o status e publica quando a Meta terminar de processar ────
// Retorna: { status: "FINISHED" | "IN_PROGRESS" | "ERROR", igPostId?: string }
export async function checkAndPublishInstagramContainer(
  creationId: string,
  instagramId: string,
  accessToken: string
): Promise<{ status: string; igPostId?: string }> {
  // Checa o status atual
  const statusRes = await fetch(
    `https://graph.facebook.com/v19.0/${creationId}?fields=status_code&access_token=${accessToken}`
  );
  const statusData = await statusRes.json();
  const statusCode: string = statusData.status_code;

  if (statusCode === "ERROR") {
    throw new Error(`Meta processamento falhou: ${JSON.stringify(statusData)}`);
  }

  if (statusCode !== "FINISHED") {
    // Ainda processando — a UI vai tentar de novo
    return { status: statusCode };
  }

  // FINISHED → publicar agora
  const publishRes = await fetch(`https://graph.facebook.com/v19.0/${instagramId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: creationId, access_token: accessToken }),
  });
  const publishData = await publishRes.json();
  if (publishData.error) throw new Error(publishData.error.message || "Erro publicando IG Story");

  return { status: "FINISHED", igPostId: publishData.id };
}

// Mantido por compatibilidade — uso interno apenas
export async function publishInstagramStory(
  videoUrl: string,
  instagramId: string,
  accessToken: string,
  onRetryLog?: (msg: string) => Promise<void>
): Promise<string> {
  const creationId = await createInstagramContainer(videoUrl, instagramId, accessToken);
  await onRetryLog?.(`✅ Container criado (ID: ${creationId})`);

  const result = await checkAndPublishInstagramContainer(creationId, instagramId, accessToken);
  if (result.igPostId) {
    await onRetryLog?.(`🚀 Publicado! ID: ${result.igPostId}`);
    return result.igPostId;
  }
  throw new Error("Publicação não concluída");
}


export async function publishFacebookVideoStory(videoUrl: string, pageId: string, accessToken: string) {
  // A API de páginas permite postar Reels. 
  // O endpoint de stories diretos via graph API para video existe como photo com parâmetros específicos,
  // ou através do endpoint de video_reels para reels.
  // Vamos usar o formato universal de vídeo (ou reels no caso de FB video).
  
  // Para Stories do Facebook nativamente via Graph API de PÁGINA:
  // Postagem de photo story supporta video pela API? Sim, mas as vezes o `video_reels` é mais estável.
  // Iremos usar o post padrão de video:
  const url = `https://graph.facebook.com/v19.0/${pageId}/videos?file_url=${encodeURIComponent(videoUrl)}&access_token=${accessToken}&description=NovaNoticia`;
  const res = await fetch(url, { method: 'POST' });
  const data = await res.json();

  if (data.error) {
    throw new Error(data.error.message || 'Error publishing FB Video');
  }

  return data.id;
}

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


export async function publishInstagramStory(
  videoUrl: string,
  instagramId: string,
  accessToken: string,
  onRetryLog?: (msg: string) => Promise<void>
): Promise<string> {
  // Passo 1: Criar o container de mídia (REELS suporta vídeo e vai para Stories)
  const createUrl = `https://graph.facebook.com/v19.0/${instagramId}/media`;
  const resContainer = await fetch(createUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media_type: "REELS",
      video_url: videoUrl,
      access_token: accessToken,
    }),
  });
  const containerData = await resContainer.json();

  if (containerData.error) {
    throw new Error(containerData.error.message || "Erro criando container IG");
  }

  const creationId = containerData.id;
  await onRetryLog?.(`✅ Container criado (ID: ${creationId})`);

  // Passo 2: Polling do status até FINISHED (máx 10 tentativas × 6s = 60s)
  const MAX_RETRIES = 10;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    await sleep(6000);
    const statusRes = await fetch(
      `https://graph.facebook.com/v19.0/${creationId}?fields=status_code&access_token=${accessToken}`
    );
    const statusData = await statusRes.json();
    const statusCode = statusData.status_code;

    await onRetryLog?.(`⏳ Tentativa ${attempt}/${MAX_RETRIES} — status: ${statusCode}`);

    if (statusCode === "FINISHED") break;
    if (statusCode === "ERROR") {
      throw new Error(`Meta falhou ao processar: ${JSON.stringify(statusData)}`);
    }
    if (attempt === MAX_RETRIES) {
      throw new Error(`Timeout: container não ficou FINISHED em ${MAX_RETRIES} tentativas`);
    }
  }

  // Passo 3: Publicar
  const publishRes = await fetch(`https://graph.facebook.com/v19.0/${instagramId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: creationId, access_token: accessToken }),
  });
  const publishData = await publishRes.json();

  if (publishData.error) {
    throw new Error(publishData.error.message || "Erro publicando IG Story");
  }

  await onRetryLog?.(`🚀 Publicado no Instagram! ID: ${publishData.id}`);
  return publishData.id;
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

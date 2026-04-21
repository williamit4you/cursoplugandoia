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

export async function publishInstagramStory(videoUrl: string, instagramId: string, accessToken: string) {
  // Passo 1: Criar o contêiner de mídia (STORIES)
  const createContainerUrl = `https://graph.facebook.com/v19.0/${instagramId}/media?media_type=STORIES&video_url=${encodeURIComponent(videoUrl)}&access_token=${accessToken}`;
  const resContainer = await fetch(createContainerUrl, { method: 'POST' });
  const containerData = await resContainer.json();
  
  if (containerData.error) {
    throw new Error(containerData.error.message || 'Error creating IG Story Container');
  }

  const creationId = containerData.id;

  // Passo 2: Publicar efetivamente
  const publishUrl = `https://graph.facebook.com/v19.0/${instagramId}/media_publish?creation_id=${creationId}&access_token=${accessToken}`;
  const resPublish = await fetch(publishUrl, { method: 'POST' });
  const publishData = await resPublish.json();

  if (publishData.error) {
     throw new Error(publishData.error.message || 'Error publishing IG Story');
  }

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

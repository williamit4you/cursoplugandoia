"use client";

import React from "react";
import { Container, Typography, Box, Grid } from "@mui/material";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ClientNoticiasList({ posts }: { posts: any[] }) {
  // Exibição Editorial (Main Column e Sidebar)
  const mainPosts = posts.slice(0, 5);
  const sidePosts = posts.slice(5, 10);

  // Fallback caso não haja nada no DB
  if (posts.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ p: 4, fontSize: '0.9rem' }}>
          Nenhuma notícia foi publicada no momento. O site está limpo!
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 5 }}>

        {/* COLUNA PRINCIPAL - MANCHETES */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 66.66%' }, width: { xs: '100%', md: '66.66%' }, overflow: 'hidden' }}>
          {mainPosts.map((post, index) => (
            <React.Fragment key={post.id}>
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 3,
                mb: 4,
                pb: 4,
                borderBottom: index !== mainPosts.length - 1 ? '1px solid #e0e0e0' : 'none',
                "&:hover .post-title": { textDecoration: "underline" }
              }}>
                {/* Imagem Editorial */}
                <Box
                  component={Link}
                  href={`/noticias/${post.slug}`}
                  sx={{
                    flexShrink: 0,
                    width: { xs: '100%', sm: 340 },
                    height: { xs: 220, sm: 200 },
                    overflow: 'hidden',
                    borderRadius: 2,
                    bgcolor: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none'
                  }}
                >
                  {post.coverImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={post.coverImage} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Typography color="textSecondary" sx={{ fontSize: '0.8rem' }}>Sem Arte</Typography>
                  )}
                </Box>

                {/* Informações Editoriais */}
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography component="span" sx={{ color: '#555', fontSize: '0.85rem', fontWeight: 'bold', mb: 0.5, textTransform: 'uppercase' }}>
                    TECNOLOGIA E CONTEÚDO
                  </Typography>

                  <Link href={`/noticias/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Typography component="h2" className="post-title" sx={{
                      color: '#c00000',
                      fontSize: { xs: '1.5rem', sm: '1.65rem' },
                      fontWeight: 900,
                      lineHeight: 1.1,
                      mb: 1.5,
                      letterSpacing: '-0.5px'
                    }}>
                      {post.title}
                    </Typography>
                  </Link>

                  {post.summary && (
                    <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'flex-start' }}>
                      <Box component="span" sx={{ color: '#c00000', fontSize: '1.2rem', lineHeight: 1 }}>•</Box>
                      <Typography sx={{ color: '#333', fontSize: '1rem', lineHeight: 1.35 }}>
                        {post.summary}
                      </Typography>
                    </Box>
                  )}

                  <Typography sx={{ color: '#888', fontSize: '0.8rem', mt: 'auto', pt: 2 }}>
                    Há {formatDistanceToNow(new Date(post.createdAt), { locale: ptBR })} — Em Portal Inteligente
                  </Typography>
                </Box>
              </Box>

              {/* PROPAGANDA CURSO MEIO DAS NOTÍCIAS */}
              {index === 1 && (
                <Box
                  component={Link}
                  href="/"
                  sx={{
                    display: 'block',
                    textDecoration: 'none',
                    background: 'linear-gradient(90deg, #111827 0%, #1f2937 100%)',
                    borderRadius: 3,
                    p: 4,
                    mb: 4,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'transform 0.2s ease',
                    '&:hover': { transform: 'scale(1.01)' }
                  }}
                >
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Typography sx={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.85rem', textTransform: 'uppercase', mb: 1, letterSpacing: '1px' }}>
                      P u b l i c i d a d e
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#fff', fontWeight: 900, mb: 1 }}>
                      Plugando IA
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#e5e7eb', mb: 3, maxWidth: 500, lineHeight: 1.4 }}>
                      Aprenda IA na prática e crie projetos que vendem em semanas. Descubra o método direto ao ponto para dominar Agentes, N8N, OpenAI e Next.js!
                    </Typography>
                    <Box sx={{ display: 'inline-block', bgcolor: '#10b981', color: '#111827', fontWeight: 'bold', px: 3, py: 1.5, borderRadius: 2 }}>
                      Acessar o Curso Agora →
                    </Box>
                  </Box>
                </Box>
              )}
            </React.Fragment>
          ))}
        </Box>

        {/* COLUNA LATERAL - WIDGET "VIU ISSO?" E PROPAGANDAS */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 calc(33.33% - 40px)' }, width: { xs: '100%', md: 'calc(33.33% - 40px)' } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'sticky', top: 20 }}>
            {/* WIDGET VIU ISSO */}
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: 'white' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                <Typography sx={{ fontWeight: 'bold', color: '#111', fontSize: '1.1rem' }}>
                  Viu isso?
                </Typography>
              </Box>

              <Box sx={{ p: 0 }}>
                {sidePosts.length === 0 && posts.length > 0 && (
                  <Typography sx={{ p: 4, fontSize: '0.9rem' }}>
                    Mais notícias exclusivas aparecerão logo aqui...
                  </Typography>
                )}

                {sidePosts.map((post, index) => (
                  <Box
                    key={post.id}
                    component={Link}
                    href={`/noticias/${post.slug}`}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      borderBottom: index !== sidePosts.length - 1 ? '1px solid #e0e0e0' : 'none',
                      textDecoration: 'none',
                      '&:hover .side-title': { textDecoration: 'underline' }
                    }}
                  >
                    <Typography component="h3" className="side-title" sx={{
                      flexGrow: 1,
                      color: '#c00000',
                      fontWeight: 800,
                      fontSize: '1rem',
                      lineHeight: 1.2
                    }}>
                      {post.title}
                    </Typography>

                    <Box sx={{
                      flexShrink: 0,
                      width: 75,
                      height: 75,
                      borderRadius: 2,
                      overflow: 'hidden',
                      bgcolor: '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {post.coverImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={post.coverImage} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Typography sx={{ fontSize: '0.6rem', color: '#999' }}>Sem Arte</Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* WIDGET CURSO (LATERAL) */}
            <Box
              component={Link}
              href="/"
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                bgcolor: 'white',
                overflow: 'hidden',
                textDecoration: 'none',
                display: 'block',
                transition: 'border-color 0.2s ease',
                '&:hover': { borderColor: '#10b981' }
              }}
            >
              <Box sx={{ bgcolor: '#0f172a', p: 3, textAlign: 'center', color: '#fff' }}>
                <Typography sx={{ color: '#34d399', fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', mb: 1, letterSpacing: '1px' }}>
                  Treinamento Exclusivo
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, mb: 1, color: '#fff' }}>
                  Plugando IA
                </Typography>
                <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 2 }}>
                  Aprenda IA na prática e crie projetos SaaS completos. Do zero ao Deploy!
                </Typography>
                <Box sx={{ display: 'inline-block', width: '100%', bgcolor: '#10b981', color: '#0f172a', fontWeight: 'bold', py: 1.5, borderRadius: 1.5 }}>
                  Inscrever-se Agora
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

      </Box>
    </Container>
  );
}

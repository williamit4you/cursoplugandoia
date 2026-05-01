"use client";

import { Container, Typography, Box, Breadcrumbs, Link as MuiLink } from "@mui/material";
import Link from "next/link";
import LeadCapture from "@/components/LeadCapture";
import ClientPostTracker from "./ClientPostTracker";

export default function ClientSinglePost({ post }: { post: any }) {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <ClientPostTracker postId={post.id} />

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 6 }}>

        {/* COLUNA PRINCIPAL - TEXTO DA NOTÍCIA */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 66.66%' }, width: { xs: '100%', md: '66.66%' } }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 4 }}>
            <MuiLink underline="hover" color="inherit" href="/noticias">Notícias</MuiLink>
            <Typography color="text.primary">{post.title}</Typography>
          </Breadcrumbs>

          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: "bold", color: '#111', fontSize: { xs: '2rem', md: '2.5rem' } }}>
            {post.title}
          </Typography>

          <Typography variant="subtitle1" sx={{ color: '#555', mb: 4, fontStyle: "italic", borderLeft: "4px solid #c00000", pl: 2, fontSize: '1.2rem' }}>
            {post.summary}
          </Typography>

          <Box
            sx={{
              color: '#333',
              "& img": { maxWidth: "100%", height: "auto", borderRadius: 2 },
              "& h2, & h3": { mt: 4, mb: 2, fontWeight: 'bold', color: '#111' },
              "& p": { lineHeight: 1.8, fontSize: "1.15rem", color: "#333", mb: 3 },
              "& strong, & b": { color: '#000' },
              "& a": { color: '#c00000', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }
            }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <Box sx={{ mt: 8 }}>
            <LeadCapture source={`post_slug_${post.slug}`} />
          </Box>
        </Box>

        {/* COLUNA LATERAL - PUBLICIDADE */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 calc(33.33% - 48px)' }, width: { xs: '100%', md: 'calc(33.33% - 48px)' } }}>
          <Box sx={{ position: 'sticky', top: 20 }}>
            <Box
              component={Link}
              href="/solucoes-ia"
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                bgcolor: 'white',
                overflow: 'hidden',
                textDecoration: 'none',
                display: 'block',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }
              }}
            >
              <Box sx={{ bgcolor: '#0f172a', p: 4, textAlign: 'center', color: '#fff' }}>
                <Typography sx={{ color: '#34d399', fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase', mb: 2, letterSpacing: '1px' }}>
                  Treinamento Exclusivo
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 2, color: '#fff' }}>
                  Plugando IA
                </Typography>
                <Typography variant="body1" sx={{ color: '#cbd5e1', mb: 4, lineHeight: 1.6 }}>
                  Aprenda IA na prática e crie projetos SaaS completos. Do absoluto zero ao Deploy!
                </Typography>
                <Box sx={{ display: 'inline-block', width: '100%', bgcolor: '#10b981', color: '#0f172a', fontWeight: '900', py: 2, borderRadius: 1.5, fontSize: '1.1rem' }}>
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

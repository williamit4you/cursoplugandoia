INSERT INTO "OperationDefinition" ("id", "key", "name", "family", "description", "enabled", "expectedEverySec", "owner", "createdAt", "updatedAt") VALUES
  ('operation_shopee_pipeline', 'SHOPEE_PIPELINE', 'Shopee e afiliados', 'PRODUCAO', 'Coleta produtos, gera ativos e prepara publicacao.', true, 60, 'pipeline', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('operation_social_publisher', 'SOCIAL_PUBLISHER', 'Publicacao social', 'DISTRIBUICAO', 'Publica posts agendados nas redes sociais.', true, 60, 'pipeline', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('operation_engagement_pipeline', 'ENGAGEMENT_PIPELINE', 'Video de engajamento', 'PRODUCAO', 'Produz videos de engajamento e suas publicacoes.', true, 60, 'pipeline', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('operation_video_questions', 'VIDEO_QUESTIONS', 'Perguntas e respostas', 'PRODUCAO', 'Processa perguntas e gera videos de resposta.', true, 300, 'pipeline', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('operation_youtube_analytics', 'YOUTUBE_ANALYTICS', 'Analytics YouTube', 'RESULTADO', 'Atualiza dados e snapshots do YouTube.', true, 3600, 'analytics', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('operation_news_content', 'NEWS_CONTENT', 'Noticias e artigos', 'CONTEUDO', 'Coleta noticias e prepara artigos e videos.', true, 3600, 'content', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

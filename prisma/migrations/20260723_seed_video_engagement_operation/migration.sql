INSERT INTO "OperationDefinition" ("id", "key", "name", "family", "description", "enabled", "expectedEverySec", "owner", "createdAt", "updatedAt") VALUES
  ('operation_video_engagement', 'VIDEO_ENGAGEMENT', 'Video Engagement', 'PRODUCAO', 'Executa a fila de projetos de video de engajamento.', true, 60, 'pipeline', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

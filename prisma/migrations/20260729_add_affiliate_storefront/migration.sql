CREATE TABLE "AffiliateStore" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "defaultCopy" TEXT NOT NULL,
  "baseUrl" TEXT NOT NULL,
  "affiliateUrl" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "complianceClass" TEXT NOT NULL DEFAULT 'STANDARD',
  "logoUrl" TEXT,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AffiliateStore_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AffiliateStoreClick" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "source" TEXT,
  "medium" TEXT,
  "campaign" TEXT,
  "referrer" TEXT,
  "userAgent" TEXT,
  "ipHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AffiliateStoreClick_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AffiliateStore_slug_key" ON "AffiliateStore"("slug");
CREATE INDEX "AffiliateStore_status_featured_sortOrder_idx" ON "AffiliateStore"("status", "featured", "sortOrder");
CREATE INDEX "AffiliateStore_category_status_idx" ON "AffiliateStore"("category", "status");
CREATE INDEX "AffiliateStoreClick_storeId_createdAt_idx" ON "AffiliateStoreClick"("storeId", "createdAt");
CREATE INDEX "AffiliateStoreClick_createdAt_idx" ON "AffiliateStoreClick"("createdAt");

ALTER TABLE "AffiliateStoreClick"
  ADD CONSTRAINT "AffiliateStoreClick_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "AffiliateStore"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "AffiliateStore"
  ("id", "name", "slug", "category", "defaultCopy", "baseUrl", "affiliateUrl", "domain", "status", "complianceClass", "featured", "sortOrder")
VALUES
  ('store-electrolux', 'Electrolux', 'electrolux', 'Eletrodomésticos', 'Encontre eletrodomésticos e soluções inteligentes para deixar a rotina da casa mais prática.', 'https://loja.electrolux.com.br/', 'https://loja.electrolux.com.br/?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata', 'loja.electrolux.com.br', 'ACTIVE', 'STANDARD', true, 10),
  ('store-cobasi', 'Cobasi', 'cobasi', 'Pet', 'Ração, higiene, brinquedos e cuidados para seu pet reunidos em um só lugar.', 'https://minhaloja.cobasi.com.br', 'https://minhaloja.cobasi.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata', 'minhaloja.cobasi.com.br', 'ACTIVE', 'STANDARD', true, 20),
  ('store-ri-happy', 'Ri Happy', 'ri-happy', 'Brinquedos', 'Brincadeiras, jogos e presentes para diferentes idades na seleção atual da Ri Happy.', 'https://www.rihappy.com.br', 'https://www.rihappy.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata', 'www.rihappy.com.br', 'ACTIVE', 'STANDARD', true, 30),
  ('store-mizuno', 'Mizuno', 'mizuno', 'Esporte', 'Tênis e acessórios para corrida, treino e uma rotina mais ativa.', 'https://www.mizuno.com.br', 'https://www.mizuno.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata', 'www.mizuno.com.br', 'ACTIVE', 'STANDARD', true, 40),
  ('store-olympikus', 'Olympikus', 'olympikus', 'Esporte', 'Do treino ao dia a dia: confira os tênis e destaques atuais da Olympikus.', 'https://www.olympikus.com.br', 'https://www.olympikus.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata', 'www.olympikus.com.br', 'ACTIVE', 'STANDARD', true, 50),
  ('store-tokstok', 'Tok&Stok', 'tokstok', 'Casa e decoração', 'Ideias, móveis e acessórios para transformar cada ambiente da casa.', 'https://www.tokstok.com.br', 'https://www.tokstok.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata', 'www.tokstok.com.br', 'ACTIVE', 'STANDARD', true, 60),
  ('store-bagaggio', 'Bagaggio', 'bagaggio', 'Viagem', 'Malas, mochilas e acessórios para organizar sua próxima viagem.', 'https://www.bagaggio.com.br', 'https://www.bagaggio.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata', 'www.bagaggio.com.br', 'ACTIVE', 'STANDARD', true, 70),
  ('store-funko-brasil', 'Funko Brasil', 'funko-brasil', 'Colecionáveis', 'Personagens e colecionáveis oficiais para fãs de todas as idades.', 'https://www.funko.com.br', 'https://www.funko.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata', 'www.funko.com.br', 'ACTIVE', 'STANDARD', true, 80),
  ('store-salon-line', 'Salon Line', 'salon-line', 'Beleza', 'Produtos para diferentes curvaturas e rotinas capilares na Salon Line.', 'https://www.salonline.com.br', 'https://www.salonline.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata', 'www.salonline.com.br', 'ACTIVE', 'STANDARD', true, 90),
  ('store-thermos-brasil', 'Thermos Brasil', 'thermos-brasil', 'Casa e rotina', 'Garrafas e recipientes térmicos para acompanhar todos os momentos do seu dia.', 'https://www.thermosbrasil.com.br', 'https://www.thermosbrasil.com.br?parceiro=12410&am=willianbarata', 'www.thermosbrasil.com.br', 'ACTIVE', 'STANDARD', true, 100),
  ('store-colormaq', 'Colormaq', 'colormaq', 'Eletrodomésticos', 'Soluções práticas para lavanderia e cozinha em uma seleção direta da loja.', 'https://loja.colormaq.com.br/', 'https://loja.colormaq.com.br/?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata', 'loja.colormaq.com.br', 'ACTIVE', 'STANDARD', true, 110),
  ('store-dji-brasil', 'DJI Brasil', 'dji-brasil', 'Tecnologia', 'Drones, câmeras e acessórios DJI disponíveis na loja oficial brasileira.', 'https://www.lojadji.com.br', 'https://www.lojadji.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata', 'www.lojadji.com.br', 'ACTIVE', 'STANDARD', true, 120);

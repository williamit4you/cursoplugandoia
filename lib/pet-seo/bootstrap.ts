import "server-only";

import { prisma } from "@/lib/prisma";
import { COBASI_STORE_SLUG, validateCobasiAffiliateUrl } from "./affiliateRules";
import { PET_CONTENT_SEEDS, PET_LOCATION_SEEDS } from "./catalog";

export async function getValidatedCobasiStore() {
  const store = await prisma.affiliateStore.findUnique({ where: { slug: COBASI_STORE_SLUG } });
  if (!store || store.status !== "ACTIVE") throw new Error("Cobasi não está ativa na tabela AffiliateStore");
  const validation = validateCobasiAffiliateUrl(store.affiliateUrl);
  if (!validation.valid) throw new Error(validation.error);
  return store;
}

export async function bootstrapPetSeoProgram() {
  const store = await getValidatedCobasiStore();
  await prisma.petSeoConfig.upsert({ where: { id: COBASI_STORE_SLUG }, update: {}, create: { id: COBASI_STORE_SLUG } });

  for (const location of PET_LOCATION_SEEDS) {
    await prisma.petLocation.upsert({
      where: { slug: location.slug },
      update: { city: location.city, state: location.state },
      create: location,
    });
  }

  const locations = await prisma.petLocation.findMany({ select: { id: true, slug: true, status: true } });
  const locationBySlug = new Map(locations.map((item) => [item.slug, item]));

  for (const seed of PET_CONTENT_SEEDS) {
    const location = seed.locationSlug ? locationBySlug.get(seed.locationSlug) : null;
    const localReady = seed.type !== "LOCAL" || location?.status === "VERIFIED";
    await prisma.petContentPage.upsert({
      where: { path: seed.path },
      update: {
        title: seed.title,
        primaryKeyword: seed.primaryKeyword,
        searchIntent: seed.searchIntent,
        internalLinksJson: JSON.stringify(seed.internalLinks),
        affiliateStoreId: store.id,
        locationId: location?.id || null,
      },
      create: {
        type: seed.type,
        status: seed.queued && localReady ? "QUEUED" : "DRAFT",
        path: seed.path,
        slug: seed.path.split("/").pop() || seed.path,
        title: seed.title,
        primaryKeyword: seed.primaryKeyword,
        searchIntent: seed.searchIntent,
        internalLinksJson: JSON.stringify(seed.internalLinks),
        affiliateStoreId: store.id,
        locationId: location?.id || null,
      },
    });
  }

  const [locationCount, pageCount, queuedCount] = await Promise.all([
    prisma.petLocation.count(),
    prisma.petContentPage.count({ where: { affiliateStoreId: store.id } }),
    prisma.petContentPage.count({ where: { affiliateStoreId: store.id, status: "QUEUED" } }),
  ]);
  return { store: store.slug, locations: locationCount, pages: pageCount, queued: queuedCount };
}


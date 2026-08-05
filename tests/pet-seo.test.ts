import assert from "node:assert/strict";
import test from "node:test";
import { buildCobasiAffiliateHref, hasForbiddenCobasiUrl, validateCobasiAffiliateUrl } from "../lib/pet-seo/affiliateRules";
import { PET_CONTENT_SEEDS, PET_LOCATION_SEEDS } from "../lib/pet-seo/catalog";

test("inventário possui 97 cidades e slugs únicos", () => {
  assert.equal(PET_LOCATION_SEEDS.length, 97);
  assert.equal(new Set(PET_LOCATION_SEEDS.map((item) => item.slug)).size, 97);
  assert.ok(PET_LOCATION_SEEDS.every((item) => /^[a-z0-9-]+-[a-z]{2}$/.test(item.slug)));
});

test("fila inicial possui conteúdos e cidades piloto sem publicação automática", () => {
  assert.ok(PET_CONTENT_SEEDS.length >= 20 && PET_CONTENT_SEEDS.length <= 30);
  assert.equal(PET_CONTENT_SEEDS.filter((item) => item.type === "LOCAL").length, 6);
  assert.ok(PET_CONTENT_SEEDS.filter((item) => item.type === "LOCAL").every((item) => !item.queued));
  assert.equal(new Set(PET_CONTENT_SEEDS.map((item) => item.path)).size, PET_CONTENT_SEEDS.length);
});

test("valida os parâmetros exatos do afiliado Cobasi", () => {
  const valid = validateCobasiAffiliateUrl("https://minhaloja.cobasi.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata");
  assert.equal(valid.valid, true);
  const missing = validateCobasiAffiliateUrl("https://minhaloja.cobasi.com.br?utm_source=mais&utm_medium=maisplataforma");
  assert.equal(missing.valid, false);
  const wrongHost = validateCobasiAffiliateUrl("https://example.com?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata");
  assert.equal(wrongHost.valid, false);
});

test("CTA sempre aponta para o redirecionador interno", () => {
  const href = buildCobasiAffiliateHref({ source: "pet_seo", medium: "content", campaign: "pets_gatos" });
  assert.ok(href.startsWith("/go/loja/cobasi?"));
  assert.ok(href.includes("campaign=pets_gatos"));
});

test("scanner bloqueia URLs diretas da Cobasi em texto ou JSON", () => {
  assert.equal(hasForbiddenCobasiUrl("Veja https://www.cobasi.com.br/produto"), true);
  assert.equal(hasForbiddenCobasiUrl({ text: "https://minhaloja.cobasi.com.br" }), true);
  assert.equal(hasForbiddenCobasiUrl("/go/loja/cobasi?campaign=x"), false);
});


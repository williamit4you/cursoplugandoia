import test from "node:test";
import assert from "node:assert/strict";
import { withCampaignTracking } from "../lib/trackingLinks";
import { calculateSeoOpportunityScore, normalizeSeoSource, validateSeoAngleDistinctness, validateSeoRelease, validateSeoSources } from "../lib/seoGovernance";
import { validateProviderResponse } from "../lib/providerContracts";
import { buildSocialRequeuePlan } from "../lib/socialRequeuePlan";

test("UTM tracking is idempotent", () => {
  const values = { source: "youtube", medium: "organic", campaign: "news_video", content: "post-1" };
  const first = withCampaignTracking("https://plugandoia.cloud/noticias/teste", values);
  const second = withCampaignTracking(first, values);
  assert.equal(second, first);
});

test("SEO opportunity score is deterministic and bounded", () => {
  const score = calculateSeoOpportunityScore({ demandScore: 80, trendScore: 70, competitionScore: 20, relevanceScore: 90, conversionScore: 60 });
  assert.equal(score, 77);
  assert.ok(score >= 0 && score <= 100);
});

test("SEO release blocks missing evidence", () => {
  const result = validateSeoRelease({ productUrl: "https://example.com/product", affiliateUrl: "https://example.com/offer", price: 99, primaryKeyword: "produto teste", intent: "commercial", sourcesJson: "[]" });
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.includes("Fontes")));
});

test("SEO sources require source and collectedAt", () => {
  const invalid = validateSeoSources(JSON.stringify([{ source: "TRENDS" }]));
  assert.equal(invalid.ok, false);
  assert.ok(invalid.issues.some((issue) => issue.includes("origem/data")));

  const valid = validateSeoSources(JSON.stringify([{ source: "TRENDS", collectedAt: "2026-07-23T10:00:00.000Z", keyword: "produto teste" }]));
  assert.equal(valid.ok, true);
  assert.equal(valid.validSources.length, 1);
});

test("SEO source normalization keeps only supported providers", () => {
  assert.equal(normalizeSeoSource("trends"), "TRENDS");
  assert.equal(normalizeSeoSource("search_console"), "SEARCH_CONSOLE");
  assert.equal(normalizeSeoSource("unknown-provider"), "MANUAL");
});

test("SEO angle distinctness blocks nearly identical briefs", () => {
  const result = validateSeoAngleDistinctness([
    { angle: "PAIN", title: "Air fryer vale a pena", keyword: "air fryer vale a pena" },
    { angle: "PRODUCT", title: "Air fryer vale a pena", keyword: "air fryer vale a pena" },
    { angle: "COMPARISON", title: "Air fryer ou forno eletrico", keyword: "air fryer vs forno eletrico" },
  ]);

  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.includes("PAIN") && issue.includes("PRODUCT")));
});

test("provider response contracts accept expected identifiers", () => {
  assert.equal(validateProviderResponse("META", { creation_id: "1" }).ok, true);
  assert.equal(validateProviderResponse("YOUTUBE", { videoId: "abc" }).ok, true);
  assert.equal(validateProviderResponse("STORAGE", { Key: "video.mp4" }).ok, true);
  assert.equal(validateProviderResponse("WORKER", { jobId: "job-1" }).ok, true);
  assert.equal(validateProviderResponse("YOUTUBE", { ok: true }).ok, false);
});

test("social requeue plan is deterministic and skips occupied future slots per platform", () => {
  const now = new Date("2026-07-23T10:00:00.000Z");
  const plan = buildSocialRequeuePlan({
    now,
    candidates: [
      { id: "meta-1", platform: "META" },
      { id: "yt-1", platform: "YOUTUBE" },
      { id: "meta-2", platform: "META" },
    ],
    futureSlots: [
      { platform: "META", scheduledTo: new Date("2026-07-23T12:00:00.000Z") },
      { platform: "YOUTUBE", scheduledTo: new Date("2026-07-23T16:00:00.000Z") },
    ],
  });

  assert.deepEqual(
    plan.map((item) => [item.item.id, item.scheduledTo.toISOString()]),
    [
      ["meta-1", "2026-07-23T14:00:00.000Z"],
      ["yt-1", "2026-07-23T18:00:00.000Z"],
      ["meta-2", "2026-07-23T20:00:00.000Z"],
    ],
  );
});

test("social requeue plan remains idempotent for the same inputs", () => {
  const input = {
    now: new Date("2026-07-23T10:00:00.000Z"),
    candidates: [
      { id: "1", platform: "META" },
      { id: "2", platform: "META" },
    ],
    futureSlots: [{ platform: "META", scheduledTo: new Date("2026-07-23T12:00:00.000Z") }],
  };

  const first = buildSocialRequeuePlan(input).map((item) => item.scheduledTo.toISOString());
  const second = buildSocialRequeuePlan(input).map((item) => item.scheduledTo.toISOString());

  assert.deepEqual(second, first);
});

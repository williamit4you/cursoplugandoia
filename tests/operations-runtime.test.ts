import test from "node:test";
import assert from "node:assert/strict";
import { withCampaignTracking } from "../lib/trackingLinks";
import { calculateSeoOpportunityScore, validateSeoRelease } from "../lib/seoGovernance";
import { validateProviderResponse } from "../lib/providerContracts";

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

test("provider response contracts accept expected identifiers", () => {
  assert.equal(validateProviderResponse("META", { creation_id: "1" }).ok, true);
  assert.equal(validateProviderResponse("YOUTUBE", { videoId: "abc" }).ok, true);
  assert.equal(validateProviderResponse("STORAGE", { Key: "video.mp4" }).ok, true);
  assert.equal(validateProviderResponse("WORKER", { jobId: "job-1" }).ok, true);
  assert.equal(validateProviderResponse("YOUTUBE", { ok: true }).ok, false);
});

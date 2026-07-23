import "server-only";

import { google } from "googleapis";

export type SearchConsoleRow = {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

function parseServiceAccountJson() {
  const raw = process.env.GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON nao configurada");
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON invalida");
  }
}

async function getSearchConsoleClient() {
  const credentials = parseServiceAccountJson();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
  return google.searchconsole({ version: "v1", auth });
}

export async function querySearchConsole(params: {
  siteUrl?: string | null;
  startDate: string;
  endDate: string;
  dimensions?: string[];
  rowLimit?: number;
  searchType?: "web" | "image" | "video" | "news" | "discover" | "googleNews";
}) {
  const siteUrl = String(params.siteUrl || process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || "").trim();
  if (!siteUrl) throw new Error("GOOGLE_SEARCH_CONSOLE_SITE_URL nao configurada");

  const client = await getSearchConsoleClient();
  const response = await client.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: params.startDate,
      endDate: params.endDate,
      dimensions: params.dimensions?.length ? params.dimensions : ["query"],
      rowLimit: Math.max(1, Math.min(25000, Number(params.rowLimit || 100))),
      searchType: params.searchType || "web",
    },
  });

  const rows = (response.data.rows || []).map((row) => ({
    keys: row.keys || [],
    clicks: Number(row.clicks || 0),
    impressions: Number(row.impressions || 0),
    ctr: Number(row.ctr || 0),
    position: Number(row.position || 0),
  })) satisfies SearchConsoleRow[];

  const totals = rows.reduce(
    (acc, row) => {
      acc.clicks += row.clicks;
      acc.impressions += row.impressions;
      return acc;
    },
    { clicks: 0, impressions: 0 },
  );

  return {
    siteUrl,
    startDate: params.startDate,
    endDate: params.endDate,
    dimensions: params.dimensions?.length ? params.dimensions : ["query"],
    searchType: params.searchType || "web",
    totals: {
      clicks: totals.clicks,
      impressions: totals.impressions,
      ctr: totals.impressions > 0 ? totals.clicks / totals.impressions : 0,
    },
    rows,
  };
}

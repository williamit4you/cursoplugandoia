import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const DAILY_NEWS_UNAVAILABLE_MESSAGE =
  "O modulo de resumo de noticias ainda nao esta pronto neste ambiente porque as tabelas DailyNewsEdition ainda nao existem na base ativa.";

export function getDailyNewsDelegates() {
  return {
    dailyNewsEdition: (prisma as any).dailyNewsEdition,
    dailyNewsEditionItem: (prisma as any).dailyNewsEditionItem,
    dailyNewsAsset: (prisma as any).dailyNewsAsset,
  };
}

export function isDailyNewsSchemaMissing(error: unknown) {
  const message = String((error as any)?.message || "");
  const code = String((error as any)?.code || "");
  return (
    code === "P2021" ||
    (message.includes("DailyNewsEdition") &&
      (message.includes("does not exist") ||
        message.includes("doesn't exist") ||
        message.includes("nao existe") ||
        message.includes("not exist")))
  );
}

export function dailyNewsUnavailableMessage(extra?: string) {
  return extra ? `${DAILY_NEWS_UNAVAILABLE_MESSAGE} ${extra}` : DAILY_NEWS_UNAVAILABLE_MESSAGE;
}

export function dailyNewsUnavailableResponse(extra?: string, status = 503) {
  return NextResponse.json(
    {
      error: dailyNewsUnavailableMessage(extra),
      code: "DAILY_NEWS_SCHEMA_MISSING",
    },
    { status },
  );
}

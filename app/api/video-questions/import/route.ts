import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

export async function POST(req: NextRequest) {
  try {
    const text = await req.text();
    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Empty CSV" }, { status: 400 });
    }

    const rows = text.split("\n").map(r => r.trim()).filter(r => r.length > 0);
    // Ignore header row if it exists (e.g. contains "pergunta")
    let startIndex = 0;
    if (rows[0].toLowerCase().includes("pergunta")) {
      startIndex = 1;
    }

    let importedCount = 0;

    for (let i = startIndex; i < rows.length; i++) {
      const line = rows[i];
      // CSV format: questionText;useExternalMedia (or comma separated)
      // We will split by separator. We can accept both ; and ,
      const sep = line.includes(";") ? ";" : ",";
      let parts = line.split(sep);
      
      let questionText = parts[0]?.trim();
      if (!questionText) continue;
      
      // Basic escaping handling if text is wrapped in quotes
      if (questionText.startsWith('"') && questionText.endsWith('"')) {
        questionText = questionText.substring(1, questionText.length - 1);
      }

      const useExternalMediaRaw = parts[1]?.trim().toLowerCase() || "false";
      const useExternalMedia = useExternalMediaRaw === "true" || useExternalMediaRaw === "1" || useExternalMediaRaw === "sim";

      await prisma.videoQuestion.create({
        data: {
          questionText,
          useExternalMedia,
          status: "PENDING",
        }
      });
      importedCount++;
    }

    return NextResponse.json({ success: true, count: importedCount });
  } catch (error: any) {
    console.error("[api/video-questions/import POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to import CSV" }, { status: 500 });
  }
}

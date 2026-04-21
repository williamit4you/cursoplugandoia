import { NextRequest, NextResponse } from "next/server";
import { getMetaAccounts } from "@/lib/metaGraph";

export async function POST(req: NextRequest) {
  try {
    const { accessToken } = await req.json();
    if (!accessToken) {
        return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const accounts = await getMetaAccounts(accessToken);
    
    // Já vem mapeado da lib
    return NextResponse.json({ accounts });

  } catch (error: any) {
     return NextResponse.json({ error: error.message || "Failed to fetch accounts" }, { status: 500 });
  }
}

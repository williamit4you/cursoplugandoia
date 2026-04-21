import { NextRequest, NextResponse } from "next/server";
import { getMetaAccounts } from "@/lib/metaGraph";

export async function POST(req: NextRequest) {
  try {
    const { accessToken } = await req.json();
    if (!accessToken) {
        return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const accounts = await getMetaAccounts(accessToken);
    
    const mapped = accounts.map((acc: any) => ({
        name: acc.name,
        pageId: acc.id,
        instagramId: acc.instagram_business_account?.id || "N/A",
        // pageAccessToken: acc.access_token // Opcional expor
    }));

    return NextResponse.json({ accounts: mapped });

  } catch (error: any) {
     return NextResponse.json({ error: error.message || "Failed to fetch accounts" }, { status: 500 });
  }
}

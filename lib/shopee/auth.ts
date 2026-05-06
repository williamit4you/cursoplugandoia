import "server-only";
import { createHash } from "node:crypto";

export type ShopeeAuthSignature = {
  timestamp: string;
  signature: string;
  authorization: string;
};

export function createShopeeAuthorizationHeader(params: {
  appId: string;
  appSecret: string;
  payload: string;
}): ShopeeAuthSignature {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHash("sha256")
    .update(`${params.appId}${timestamp}${params.payload}${params.appSecret}`, "utf8")
    .digest("hex");

  return {
    timestamp,
    signature,
    authorization: `SHA256 Credential=${params.appId}, Timestamp=${timestamp}, Signature=${signature}`,
  };
}

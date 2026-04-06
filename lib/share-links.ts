import { createHmac } from "crypto";

export type ShareAccessLevel = "view" | "comment" | "edit";

export type ShareLinkPayload = {
  workspaceId: string;
  accessLevel: ShareAccessLevel;
  issuedAt: number;
};

function getShareLinkSecret() {
  const secret = process.env.COLLABCANVAS_SHARE_LINK_SECRET;
  if (!secret) {
    throw new Error("Missing COLLABCANVAS_SHARE_LINK_SECRET environment variable.");
  }
  return secret;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string) {
  return createHmac("sha256", getShareLinkSecret()).update(payload).digest("base64url");
}

export function createShareToken(payload: ShareLinkPayload) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyShareToken(token: string): ShareLinkPayload | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  try {
    const expectedSignature = sign(encodedPayload);
    if (expectedSignature !== signature) return null;

    const parsed = JSON.parse(base64UrlDecode(encodedPayload)) as ShareLinkPayload;
    if (
      !parsed ||
      typeof parsed.workspaceId !== "string" ||
      typeof parsed.accessLevel !== "string" ||
      typeof parsed.issuedAt !== "number"
    ) {
      return null;
    }

    if (!["view", "comment", "edit"].includes(parsed.accessLevel)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

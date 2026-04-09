import { createHmac, timingSafeEqual } from "crypto";

export type ShareAccessLevel = "view" | "comment" | "edit";

export type ShareLinkPayload = {
  workspaceId: string;
  accessLevel: ShareAccessLevel;
  issuedAt: number;
};

const COMPACT_TOKEN_PREFIX = "s1";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function uuidToHex(value: string) {
  return value.replace(/-/g, "").toLowerCase();
}

function hexToUuid(value: string) {
  if (!/^[0-9a-f]{32}$/i.test(value)) {
    return null;
  }
  const hex = value.toLowerCase();
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function accessLevelToCode(level: ShareAccessLevel) {
  if (level === "view") return "v";
  if (level === "comment") return "c";
  return "e";
}

function codeToAccessLevel(code: string): ShareAccessLevel | null {
  if (code === "v") return "view";
  if (code === "c") return "comment";
  if (code === "e") return "edit";
  return null;
}

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

function timingSafeEqualText(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function createLegacyToken(payload: ShareLinkPayload) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function createCompactToken(payload: ShareLinkPayload) {
  if (!isUuid(payload.workspaceId)) {
    return null;
  }

  const workspaceHex = uuidToHex(payload.workspaceId);
  const accessCode = accessLevelToCode(payload.accessLevel);
  const issuedAt = Math.max(0, Math.floor(payload.issuedAt));
  const issuedAt36 = issuedAt.toString(36);
  const compactBody = `${workspaceHex}${accessCode}${issuedAt36}`;
  const signedBody = `${COMPACT_TOKEN_PREFIX}.${compactBody}`;
  const signature = sign(signedBody).slice(0, 18);

  return `${COMPACT_TOKEN_PREFIX}.${compactBody}.${signature}`;
}

export function createShareToken(payload: ShareLinkPayload) {
  return createCompactToken(payload) ?? createLegacyToken(payload);
}

function verifyCompactToken(token: string): ShareLinkPayload | null {
  const [prefix, body, signature] = token.split(".");
  if (prefix !== COMPACT_TOKEN_PREFIX || !body || !signature) return null;
  if (body.length < 34) return null;

  const workspaceHex = body.slice(0, 32);
  const accessCode = body.slice(32, 33);
  const issuedAt36 = body.slice(33);

  const workspaceId = hexToUuid(workspaceHex);
  const accessLevel = codeToAccessLevel(accessCode);
  const issuedAt = Number.parseInt(issuedAt36, 36);
  if (!workspaceId || !accessLevel || !Number.isFinite(issuedAt)) return null;

  const signedBody = `${COMPACT_TOKEN_PREFIX}.${body}`;
  const expectedSignature = sign(signedBody).slice(0, 18);
  if (!timingSafeEqualText(expectedSignature, signature)) return null;

  return {
    workspaceId,
    accessLevel,
    issuedAt,
  };
}

function verifyLegacyToken(token: string): ShareLinkPayload | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  try {
    const expectedSignature = sign(encodedPayload);
    if (!timingSafeEqualText(expectedSignature, signature)) return null;

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

export function verifyShareToken(token: string): ShareLinkPayload | null {
  if (token.startsWith(`${COMPACT_TOKEN_PREFIX}.`)) {
    return verifyCompactToken(token);
  }

  return verifyLegacyToken(token);
}

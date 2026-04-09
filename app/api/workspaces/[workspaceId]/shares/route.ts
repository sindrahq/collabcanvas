import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createShareToken, type ShareAccessLevel } from "@/lib/share-links";

type ShareRequestBody = {
  mode?: "email" | "link";
  email?: string;
  accessLevel?: ShareAccessLevel;
};

function isShareAccessLevel(value: unknown): value is ShareAccessLevel {
  return value === "view" || value === "comment" || value === "edit";
}

async function sendInviteEmail(args: {
  to: string;
  workspaceName: string;
  inviterName: string;
  shareLink: string;
  accessLevel: ShareAccessLevel;
}): Promise<{ sent: boolean; warning?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL;

  if (!resendApiKey || !resendFromEmail) {
    return {
      sent: false,
      warning:
        "Email provider is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL to send workspace invites.",
    };
  }

  const accessLabel = args.accessLevel === "comment" ? "comment" : args.accessLevel === "edit" ? "edit" : "view";
  const subject = `${args.inviterName} invited you to collaborate on ${args.workspaceName}`;
  const text = [
    `You were invited to collaborate on ${args.workspaceName}.`,
    `Access level: ${accessLabel}`,
    `Open the workspace: ${args.shareLink}`,
    "",
    "If you were not expecting this invite, you can ignore this email.",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1a1a1a">
      <h2 style="margin:0 0 12px">You were invited to collaborate on ${args.workspaceName}</h2>
      <p style="margin:0 0 8px">Access level: <strong>${accessLabel}</strong></p>
      <p style="margin:0 0 16px"><a href="${args.shareLink}" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:10px 16px;border-radius:10px">Open workspace</a></p>
      <p style="margin:0 0 8px;color:#5f584e;font-size:14px">Or copy this link:</p>
      <p style="margin:0;word-break:break-all;font-size:14px">${args.shareLink}</p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: [args.to],
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { message?: string } | null;
    return {
      sent: false,
      warning: errorBody?.message || `Failed to send invite email (${response.status}).`,
    };
  }

  return { sent: true };
}

export async function POST(request: NextRequest, context: { params: Promise<{ workspaceId: string }> }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Authentication is unavailable." }, { status: 500 });
  }

  const { workspaceId } = await context.params;

  if (workspaceId.startsWith("local-")) {
    return NextResponse.json(
      { error: "This workspace is local-only and cannot be shared until it is synced to Supabase." },
      { status: 400 }
    );
  }

  let body: ShareRequestBody;
  try {
    body = (await request.json()) as ShareRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const mode = body.mode ?? "email";
  const accessLevel = isShareAccessLevel(body.accessLevel) ? body.accessLevel : "view";
  const email = body.email?.trim().toLowerCase() || "";

  let cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }> = [];

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(nextCookies) {
        cookiesToSet = nextCookies;
      },
    },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, owner_id, name")
    .eq("id", workspaceId)
    .maybeSingle();

  if (workspaceError) {
    return NextResponse.json({ error: workspaceError.message }, { status: 400 });
  }

  if (!workspace) {
    return NextResponse.json(
      { error: "Workspace not found, or you do not have access to share it." },
      { status: 404 }
    );
  }

  if (workspace.owner_id !== userData.user.id) {
    return NextResponse.json({ error: "Only the owner can share this workspace." }, { status: 403 });
  }

  if (mode === "link") {
    try {
      const token = createShareToken({
        workspaceId,
        accessLevel,
        issuedAt: Date.now(),
      });

      const response = NextResponse.json({
        shareLink: `${new URL(request.url).origin}/s/${encodeURIComponent(token)}`,
        token,
        accessLevel,
      });

      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });

      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create share link.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (!email) {
    return NextResponse.json({ error: "Recipient email is required." }, { status: 400 });
  }

  const { error: shareError } = await supabase.from("workspace_shares").insert({
    workspace_id: workspaceId,
    shared_by_id: userData.user.id,
    shared_with_email: email,
    access_level: accessLevel,
    share_kind: "email",
    active: true,
  });

  if (shareError) {
    const missingSharesTable = shareError.message.includes("Could not find the table 'public.workspace_shares'");
    if (missingSharesTable) {
      return NextResponse.json(
        { error: "Workspace sharing table is missing. Run docs/SUPABASE_WORKSPACE_SHARES_TABLE_FIX.sql in Supabase SQL Editor." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: shareError.message }, { status: 400 });
  }

  if (mode === "email") {
    const token = createShareToken({
      workspaceId,
      accessLevel,
      issuedAt: Date.now(),
    });
    const shareLink = `${new URL(request.url).origin}/s/${encodeURIComponent(token)}`;

    try {
      const inviterName =
        typeof userData.user.user_metadata?.full_name === "string" && userData.user.user_metadata.full_name.trim()
          ? userData.user.user_metadata.full_name.trim()
          : userData.user.email || "Someone";

      const emailResult = await sendInviteEmail({
        to: email,
        workspaceName: workspace.name,
        inviterName,
        shareLink,
        accessLevel,
      });

      const response = NextResponse.json({
        sharedWithEmail: email,
        accessLevel,
        shareLink,
        emailSent: emailResult.sent,
        emailWarning: emailResult.warning,
      });

      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });

      return response;
    } catch (emailError) {
      const warning =
        emailError instanceof Error
          ? emailError.message
          : "Invite saved, but email could not be sent.";

      const response = NextResponse.json({
        sharedWithEmail: email,
        accessLevel,
        shareLink,
        emailSent: false,
        emailWarning: warning,
      });

      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });

      return response;
    }
  }

  const response = NextResponse.json({
    sharedWithEmail: email,
    accessLevel,
  });

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}

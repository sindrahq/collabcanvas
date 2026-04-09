import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

type InsertErrorLike = {
  message?: string;
};

function extractMissingColumn(error: InsertErrorLike | null): string | null {
  const message = error?.message || "";
  const quoted = message.match(/Could not find the '([^']+)' column/i);
  if (quoted?.[1]) return quoted[1];

  const generic = message.match(/column\s+"([^"]+)"\s+does not exist/i);
  if (generic?.[1]) return generic[1];

  return null;
}

function stripColumn<T extends Record<string, unknown>>(rows: T[], column: string): T[] {
  return rows.map((row) => {
    if (!(column in row)) return row;
    const next = { ...row };
    delete next[column];
    return next;
  });
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isUuidSyntaxError(error: InsertErrorLike | null): boolean {
  const message = error?.message || "";
  return /invalid input syntax for type uuid/i.test(message);
}

function stripInvalidUuidColumnsForTable(
  table: string,
  rows: Record<string, unknown>[]
): { rows: Record<string, unknown>[]; changed: boolean } {
  if (!rows.length) {
    return { rows, changed: false };
  }

  // Local canvas IDs look like "circle-xxxx" and fail on UUID id columns in older schemas.
  if (table === "canvas_elements") {
    const shouldDropId = rows.some((row) => typeof row.id === "string" && !isUuid(row.id));
    if (shouldDropId) {
      return { rows: stripColumn(rows, "id"), changed: true };
    }
  }

  // Some schemas use uuid for target_element_id while local ids are non-UUID strings.
  if (table === "workspace_comments") {
    const shouldDropTarget = rows.some(
      (row) => typeof row.target_element_id === "string" && !isUuid(row.target_element_id)
    );
    if (shouldDropTarget) {
      return { rows: stripColumn(rows, "target_element_id"), changed: true };
    }
  }

  return { rows, changed: false };
}

async function insertWithSchemaFallback(
  dbClient: ReturnType<typeof createClient> | ReturnType<typeof createServerClient>,
  table: string,
  rows: Record<string, unknown>[]
) {
  let candidateRows = rows;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { error } = await dbClient.from(table).insert(candidateRows);
    if (!error) {
      return { error: null as null | InsertErrorLike, strippedColumns: attempt };
    }

    if (isUuidSyntaxError(error)) {
      const uuidFallback = stripInvalidUuidColumnsForTable(table, candidateRows);
      if (uuidFallback.changed) {
        candidateRows = uuidFallback.rows;
        continue;
      }
    }

    const missingColumn = extractMissingColumn(error);
    if (!missingColumn) {
      return { error, strippedColumns: attempt };
    }

    const nextRows = stripColumn(candidateRows, missingColumn);
    const unchanged = JSON.stringify(nextRows) === JSON.stringify(candidateRows);
    if (unchanged) {
      return { error, strippedColumns: attempt };
    }

    candidateRows = nextRows;
  }

  return {
    error: { message: `Insert failed for ${table} after schema fallback attempts.` },
    strippedColumns: 8,
  };
}

type SyncLocalRequestBody = {
  workspaceName?: string;
  elements?: Array<{
    id: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    text?: string | null;
    layerOrder?: number;
    visible?: boolean;
    locked?: boolean;
    style?: {
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      opacity?: number;
      fontSize?: number;
      fontFamily?: string;
      fontStyle?: string;
      fontWeight?: string;
      textAlign?: string;
      shadowEnabled?: boolean;
      shadowBlur?: number;
      shadowColor?: string;
      shadowOffsetX?: number;
      shadowOffsetY?: number;
    };
  }>;
  comments?: Array<{
    authorId?: string;
    authorName?: string;
    authorEmail?: string | null;
    message?: string;
    targetElementId?: string | null;
    resolved?: boolean;
    resolvedAt?: string | null;
  }>;
};

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Authentication is unavailable." }, { status: 500 });
  }

  let body: SyncLocalRequestBody;
  try {
    body = (await request.json()) as SyncLocalRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const workspaceName = (body.workspaceName || "Untitled Project").trim();
  const elements = Array.isArray(body.elements) ? body.elements : [];
  const comments = Array.isArray(body.comments) ? body.comments : [];

  let cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }> = [];

  const authClient = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(nextCookies) {
        cookiesToSet = nextCookies;
      },
    },
  });

  const { data: userData, error: userError } = await authClient.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const dbClient = serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : authClient;

  const { data: workspaceRow, error: workspaceError } = await dbClient
    .from("workspaces")
    .insert({
      name: workspaceName || "Untitled Project",
      owner_id: userData.user.id,
    })
    .select("id, name, owner_id")
    .single();

  if (workspaceError || !workspaceRow) {
    const isOwnerFkError = workspaceError?.code === "23503" && workspaceError.message.includes("workspaces_owner_id_fkey");
    const suffix = serviceRoleKey
      ? ""
      : isOwnerFkError
        ? " (Run docs/SUPABASE_WORKSPACES_OWNER_FK_FIX.sql in Supabase SQL Editor.)"
        : " (Set SUPABASE_SERVICE_ROLE_KEY on server, or run docs/SUPABASE_WORKSPACES_INSERT_FIX.sql in Supabase SQL Editor.)";
    return NextResponse.json(
      { error: `${workspaceError?.message || "Could not create workspace."}${suffix}` },
      { status: 400 }
    );
  }

  if (elements.length) {
    const rows = elements.map((element) => ({
      id: element.id,
      workspace_id: workspaceRow.id,
      type: element.type,
      position: {
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
      },
      rotation: element.rotation ?? 0,
      text_content: element.text ?? null,
      style_ext: {
        fill: element.style?.fill,
        stroke: element.style?.stroke,
        strokeWidth: element.style?.strokeWidth,
        opacity: element.style?.opacity,
        fontSize: element.style?.fontSize,
        fontFamily: element.style?.fontFamily,
        fontStyle: element.style?.fontStyle,
        fontWeight: element.style?.fontWeight,
        textAlign: element.style?.textAlign,
        shadowEnabled: element.style?.shadowEnabled,
        shadowBlur: element.style?.shadowBlur,
        shadowColor: element.style?.shadowColor,
        shadowOffsetX: element.style?.shadowOffsetX,
        shadowOffsetY: element.style?.shadowOffsetY,
      },
      layer_order: element.layerOrder ?? 0,
      visible: element.visible ?? true,
      locked: element.locked ?? false,
    }));

    const { error: insertElementsError } = await insertWithSchemaFallback(dbClient, "canvas_elements", rows);
    if (insertElementsError) {
      return NextResponse.json({ error: insertElementsError.message }, { status: 400 });
    }
  }

  if (comments.length) {
    const rows = comments
      .filter((comment) => comment.message && comment.authorId)
      .map((comment) => ({
        workspace_id: workspaceRow.id,
        author_id: comment.authorId,
        author_name: comment.authorName || "User",
        author_email: comment.authorEmail ?? null,
        message: (comment.message || "").trim(),
        target_element_id: comment.targetElementId ?? null,
        resolved: comment.resolved ?? false,
        resolved_at: comment.resolvedAt ?? null,
      }));

    if (rows.length) {
      const { error: insertCommentsError } = await insertWithSchemaFallback(dbClient, "workspace_comments", rows);
      if (insertCommentsError) {
        return NextResponse.json({ error: insertCommentsError.message }, { status: 400 });
      }
    }
  }

  const response = NextResponse.json({
    workspace: {
      id: workspaceRow.id,
      name: workspaceRow.name,
      owner_id: workspaceRow.owner_id,
    },
  });

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}

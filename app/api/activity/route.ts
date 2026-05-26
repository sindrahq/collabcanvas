import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role key on server-side to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace_id, user_id, user_name, action, element_name, element_type } = body;

    console.log("[Activity API POST] Received:", { workspace_id, user_name, action, element_name });

    if (!workspace_id || !user_name || !action) {
      console.warn("Activity API: Missing required fields", { workspace_id, user_name, action });
      return NextResponse.json(
        { error: "Missing required fields: workspace_id, user_name, action" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.from("activity_log").insert([
      {
        workspace_id,
        user_id: user_id || null,
        user_name,
        action,
        element_name: element_name || null,
        element_type: element_type || null,
      },
    ]);

    if (error) {
      console.error("[Activity API] Insert error:", error);
      return NextResponse.json(
        { error: `Supabase error: ${error.message}` },
        { status: 500 }
      );
    }

    console.log("[Activity API] Successfully logged");
    return NextResponse.json({ success: true, data });
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.error("Activity logging exception:", errorMsg, e);
    return NextResponse.json(
      { error: `Exception: ${errorMsg}` },
      { status: 500 }
    );
  }
}

export async function logActivity({
  workspace_id,
  user_id,
  user_name,
  action,
  element_name,
  element_type,
}: {
  workspace_id: string;
  user_id: string;
  user_name: string;
  action: string;
  element_name?: string | null;
  element_type?: string | null;
}) {
  try {
    const response = await fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspace_id,
        user_id,
        user_name,
        action,
        element_name,
        element_type,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(
        "Activity log error:",
        `Status ${response.status}:`,
        text
      );
      try {
        const error = JSON.parse(text);
        return { data: null, error: new Error(error.error || "Failed to log activity") };
      } catch {
        return { data: null, error: new Error(`HTTP ${response.status}: ${text}`) };
      }
    }

    const data = await response.json();
    console.log("Activity logged:", { workspace_id, action, user_name });
    return { data, error: null };
  } catch (e) {
    console.error("Activity log exception:", e);
    return { data: null, error: e as Error };
  }
}

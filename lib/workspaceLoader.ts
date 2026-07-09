import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Prefix for storing local workspace drafts in localStorage
const LOCAL_WORKSPACE_DRAFT_PREFIX = "collabcanvas_workspace_draft_";
import { type CanvasElement, getOrCreateWorkspaceStore } from "../store/workspaceStore";
import type { CanvasElement as DbCanvasElement, WorkspaceMeta } from "../types/canvas";

function mapDbElement(element: DbCanvasElement): CanvasElement {
  const label = `${element.type[0].toUpperCase()}${element.type.slice(1)} ${element.layer_order + 1}`;
  const styleExt = (element.style_ext as Record<string, unknown> | null | undefined) ?? null;
  const base = styleExt ?? (element.style as Record<string, unknown> | null | undefined) ?? {};

  function pick<T>(key: string, fallback: T): T {
    const v = base[key];
    return (v !== null && v !== undefined) ? (v as T) : fallback;
  }

  return {
    id: element.id,
    workspaceId: element.workspace_id,
    name: label,
    label,
    type: element.type as any,
    x: element.position.x,
    y: element.position.y,
    width: element.position.width,
    height: element.position.height,
    rotation: element.rotation ?? 0,
    visible: element.visible,
    locked: element.locked,
    layerOrder: element.layer_order,
    layer_order: element.layer_order,
    text: element.text_content ?? (element.type === "text" ? "Loaded text element" : undefined),
    style: {
      fill:          pick("fill", "#f7f2ea"),
      stroke:        pick("stroke", "#2f2f2f"),
      strokeWidth:   pick("strokeWidth", 1),
      opacity:       pick("opacity", 1),
      fontSize:      pick("fontSize", 28),
      fontFamily:    pick("fontFamily", "Inter"),
      fontStyle:     pick("fontStyle", "normal"),
      fontWeight:    pick("fontWeight", "normal"),
      textAlign:     pick("textAlign", "left"),
      shadowEnabled: pick("shadowEnabled", false),
      shadowBlur:    pick("shadowBlur", 16),
      shadowColor:   pick("shadowColor", "rgba(20,32,28,0.3)"),
      shadowOffsetX: pick("shadowOffsetX", 0),
      shadowOffsetY: pick("shadowOffsetY", 6),
      brightness:    pick("brightness", 0),
      contrast:      pick("contrast", 0),
      tint:          pick("tint", 0),
      imageUrl:      pick("imageUrl", undefined),
    },
    imageUrl: pick("imageUrl", undefined),
    parentId: pick("parentId", undefined),
    layoutProps: pick("layoutProps", undefined),
    points: pick("points", undefined),
    videoUrl: element.video_url ?? undefined,
    trimStart: element.trim_start ?? undefined,
    trimEnd: element.trim_end ?? undefined,
  };
}

export async function loadWorkspace(workspaceId: string, redirect404?: () => void): Promise<boolean> {
  // If this is a local workspace (prefixed with "local-"), load from localStorage instead of Supabase.
  if (workspaceId.startsWith('local-')) {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(`${LOCAL_WORKSPACE_DRAFT_PREFIX}${workspaceId}`) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as { workspaceName?: string; selectedElementId?: string | null; elements?: any[] };
        const store = getOrCreateWorkspaceStore(workspaceId).getState();
        // Populate store with saved draft data.
        store.setWorkspace({ id: workspaceId, name: parsed.workspaceName ?? 'Untitled Project', owner_id: 'local-user' });
        if (Array.isArray(parsed.elements)) store.setElements(parsed.elements);
        store.setSelectedElementId(parsed.selectedElementId ?? null);
        // No activity log for local workspaces.
        store.clearActivityLog();
        return true;
      }
    } catch {
      // If parsing fails, fall through to empty workspace.
    }
    // If no local data exists, initialize empty workspace state.
    const store = getOrCreateWorkspaceStore(workspaceId).getState();
    store.setWorkspace({ id: workspaceId, name: 'Untitled Project', owner_id: 'local-user' });
    store.setElements([]);
    store.setSelectedElementId(null);
    store.clearActivityLog();
    return true;
  }

  const workspaceStore = getOrCreateWorkspaceStore(workspaceId);
  const store = workspaceStore.getState();
  // Attempt to hydrate from a local draft before DB load (elements + optional name)
  const draftRaw = typeof window !== 'undefined' ? window.localStorage.getItem(`${LOCAL_WORKSPACE_DRAFT_PREFIX}${workspaceId}`) : null;
  let draftWorkspaceName: string | undefined;
  if (draftRaw) {
    try {
      const draft = JSON.parse(draftRaw) as { workspaceName?: string; selectedElementId?: string | null; elements?: any[] };
      if (draft.workspaceName) draftWorkspaceName = draft.workspaceName;
      if (Array.isArray(draft.elements) && draft.elements.length > 0) {
        // Preserve draft elements without overwriting the real owner_id.
        store.setElements(draft.elements);
        store.setSelectedElementId(draft.selectedElementId ?? null);
        // Continue loading the workspace from Supabase – do NOT return early.
      }
    } catch {}
  }
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return false;

  store.setLoading(true);

  

  try {
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id, name, owner_id")
      .eq("id", workspaceId)
      .single();

    if (workspaceError || !workspace) {
      if (redirect404) {
        redirect404();
      }
      return false;
    }

    store.setWorkspace(workspace as WorkspaceMeta);

    const { data: elements, error: elementsError } = await supabase
      .from("canvas_elements")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("layer_order", { ascending: true });

    if (elementsError) {
      // Preserve in-memory state on transient fetch errors to avoid apparent data loss.
      return false;
    }

    const loadedElements = ((elements as DbCanvasElement[] | null) ?? []).map(mapDbElement);

    // Guard against save race condition: auto-save does DELETE then INSERT.
    // Realtime fires on the DELETE before the INSERT completes, returning an
    // empty table. If the DB returned 0 elements but we already have elements
    // in memory, skip the overwrite — the INSERT Realtime event will reload correctly.
    const currentElements = workspaceStore.getState().elements;
    if (loadedElements.length === 0 && currentElements.length > 0) {
      return true;
    }

    store.setElements(loadedElements);
    store.setSelectedElementId(null);

    workspaceStore.setState({
      history: [loadedElements.map((el) => ({ ...el, style: { ...el.style } }))],
      historyIndex: 0,
    });

    // Load activity log from Supabase (up to 50 most recent entries)
    const { data: activityLogs, error: activityError } = await supabase
      .from("activity_log")
      .select("id, action, user_name, element_name, element_type, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (activityError) {
      console.warn("Activity log load error:", activityError);
    } else if (activityLogs && activityLogs.length > 0) {
      console.log(`Loaded ${activityLogs.length} activity entries for workspace ${workspaceId}`);
      const activityEntries = (activityLogs as Array<{
        id: string;
        action: "added" | "deleted" | "updated" | "moved";
        user_name?: string | null;
        element_name?: string | null;
        element_type?: string | null;
        created_at: string;
      }>)
        .map((log) => ({
          id: log.id,
          action: log.action as "added" | "deleted" | "updated" | "moved",
          userName: log.user_name || "User",
          elementName: log.element_name || "Element",
          elementType: log.element_type || "unknown",
          timestamp: new Date(log.created_at).getTime(),
        }))
        .reverse(); // Reverse to show oldest first, newest last

      store.clearActivityLog();
      activityEntries.forEach((entry) => store.pushActivityLog(entry));
    } else {
      console.log("No activities found for workspace", workspaceId);
    }

    return true;
  } catch {
    return false;
  } finally {
    store.setLoading(false);
  }
}

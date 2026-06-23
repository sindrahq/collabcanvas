import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { type CanvasElement, getOrCreateWorkspaceStore } from "../store/workspaceStore";
import type { CanvasElement as DbCanvasElement, WorkspaceMeta } from "../types/canvas";

function mapDbElement(element: DbCanvasElement): CanvasElement {
  const label = `${element.type[0].toUpperCase()}${element.type.slice(1)} ${element.layer_order + 1}`;
  const styleExt = (element.style_ext as Partial<CanvasElement["style"]> | null | undefined) ?? null;
  const style = styleExt ?? element.style;

  return {
    id: element.id,
    workspaceId: element.workspace_id,
    name: label,
    label,
    type: element.type,
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
      fill: style.fill ?? "#f7f2ea",
      stroke: style.stroke ?? "#2f2f2f",
      strokeWidth: style.strokeWidth ?? 1,
      opacity: style.opacity ?? 1,
      fontSize: style.fontSize ?? 28,
      fontFamily: "Inter",
      fontStyle: "normal",
      fontWeight: "normal",
      textAlign: "left",
      shadowEnabled: false,
      shadowBlur: 12,
      shadowColor: "#00000033",
      shadowOffsetX: 0,
      shadowOffsetY: 4,
      imageUrl: (style as any).imageUrl ?? undefined
    } as any
  };
}

export async function loadWorkspace(workspaceId: string, redirect404?: () => void): Promise<boolean> {
  const workspaceStore = getOrCreateWorkspaceStore(workspaceId);
  const store = workspaceStore.getState();
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
      store.setElements([]);
      store.setSelectedElementId(null);
      return false;
    }

    const loadedElements = ((elements as DbCanvasElement[] | null) ?? []).map(mapDbElement);
    store.setElements(loadedElements);
    store.setSelectedElementId(null);
    
    // Reset history and historyIndex 
    workspaceStore.setState({
        history: [loadedElements.map((el) => ({ ...el, style: { ...el.style } }))],
        historyIndex: 0
    });
    
    return true;
  } catch {
    return false;
  } finally {
    store.setLoading(false);
  }
}

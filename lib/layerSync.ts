import { supabase } from "@/lib/supabaseClient";
import type { CanvasElement } from "@/store/workspaceStore";

export async function syncLayerOrder(elements: CanvasElement[]) {
  const updates = elements.map((el) => ({
    id: el.id,
    layer_order: el.layerOrder,
    workspace_id: el.workspaceId ?? null,
    type: el.type,
    position: {
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
      rotation: el.rotation,
    },
    style: el.style,
    visible: el.visible,
    locked: el.locked,
  }));

  const { error } = await supabase
    .from("canvas_elements")
    .upsert(updates);

  if (error) {
    console.error("[layerSync] Failed to sync layer order:", error.message);
  } else {
    console.log("[layerSync] Layer order synced for", elements.length, "elements");
  }
}

export async function loadElementsFromDB(workspaceId: string): Promise<CanvasElement[]> {
  const { data, error } = await supabase
    .from("canvas_elements")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("layer_order", { ascending: true });

  if (error) {
    console.error("[layerSync] Failed to load elements:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name ?? `${row.type} ${row.layer_order + 1}`,
    label: row.name ?? `${row.type} ${row.layer_order + 1}`,
    type: row.type,
    x: row.position?.x ?? 0,
    y: row.position?.y ?? 0,
    width: row.position?.width ?? 100,
    height: row.position?.height ?? 100,
    rotation: row.position?.rotation ?? 0,
    layerOrder: row.layer_order ?? 0,
    layer_order: row.layer_order ?? 0,
    visible: row.visible ?? true,
    locked: row.locked ?? false,
    style: row.style ?? {
      fill: "#cccccc",
      stroke: "#000000",
      strokeWidth: 1,
      opacity: 1,
      fontSize: 16,
    },
  }));
}
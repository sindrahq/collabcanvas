import { supabase } from "@/lib/supabaseClient";
import type { CanvasElement } from "@/store/workspaceStore";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function syncElementStyle(element: CanvasElement) {
  if (!UUID_REGEX.test(element.id)) {
    console.log("[styleSync] Skipping non-UUID element:", element.id);
    return;
  }
  const { error } = await supabase
    .from("canvas_elements")
    .upsert({
      id: element.id,
      workspace_id: element.workspaceId ?? null,
      type: element.type,
      position: {
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        rotation: element.rotation,
      },
      style: {
        fill: element.style.fill,
        stroke: element.style.stroke,
        strokeWidth: element.style.strokeWidth,
        opacity: element.style.opacity,
        fontSize: element.style.fontSize,
      },
      layer_order: element.layerOrder,
      visible: element.visible,
      locked: element.locked,
    });

  if (error) {
    console.error("[styleSync] Failed to sync element style:", error.message);
  } else {
    console.log("[styleSync] Synced element:", element.id);
  }
}

export async function syncAllElements(elements: CanvasElement[]) {
  await Promise.all(elements.map((el) => syncElementStyle(el)));
}

export async function deleteElementFromDB(elementId: string) {
  const { error } = await supabase
    .from("canvas_elements")
    .delete()
    .eq("id", elementId);

  if (error) {
    console.error("[styleSync] Failed to delete element:", error.message);
  } else {
    console.log("[styleSync] Deleted element:", elementId);
  }
}
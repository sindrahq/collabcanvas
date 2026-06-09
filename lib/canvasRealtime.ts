export type CanvasChannelEvent = "cursor-move" | "canvas-update" | "role-change";

export function canvasChannelName(canvasId: string) {
  return `canvas:${canvasId}`;
}

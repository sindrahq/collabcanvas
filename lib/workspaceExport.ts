import jsPDF from "jspdf";
import { getOrCreateWorkspaceStore } from "@/store/workspaceStore";

/**
 * Gets the actual Konva Stage canvas. 
 * Note: Konva uses multiple layers; querySelector selects the top-most visible one.
 */
function getStageCanvas(): HTMLCanvasElement | null {
  return document.querySelector(".konva-stage canvas");
}

async function getStageInstance() {
  if (typeof window === "undefined") return null;
  const container = document.querySelector(".konva-stage");
  if (!container) return null;
  // Dynamic import so Konva is never bundled for SSR
  const Konva = (await import("konva")).default;
  return Konva.stages.find((stage) => stage.container() === container) ?? null;
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.click();
}

/**
 * Wrapper to hide selection transformers and UI layers before export.
 * This ensures the exported image doesn't include selection handles or guides.
 */
async function withSelectionHidden<T>(workspaceId: string, task: () => Promise<T>): Promise<T> {
  const stage = await getStageInstance();
  if (!stage) {
    return await task();
  }

  const layers = stage.getLayers();
  const mainLayer = layers[0];
  const otherLayers = layers.slice(1);
  const transformers = mainLayer ? mainLayer.find("Transformer") : [];

  // Hide UI layers and transformers
  otherLayers.forEach((l) => l.hide());
  transformers.forEach((t) => t.hide());
  stage.draw();

  try {
    return await task();
  } finally {
    // Restore UI layers and transformers
    otherLayers.forEach((l) => l.show());
    transformers.forEach((t) => t.show());
    stage.draw();
  }
}


export async function exportWorkspaceAsPng(workspaceId: string, filename = "workspace.png"): Promise<boolean> {
  return withSelectionHidden(workspaceId, async () => {
    const canvas = getStageCanvas();
    if (!canvas) return false;
    
    // We use a high quality data URL
    downloadDataUrl(canvas.toDataURL("image/png", 1.0), filename);
    return true;
  });
}

export async function exportWorkspaceAsJpeg(workspaceId: string, filename = "workspace.jpeg"): Promise<boolean> {
  return withSelectionHidden(workspaceId, async () => {
    const canvas = getStageCanvas();
    if (!canvas) return false;

    const copy = document.createElement("canvas");
    copy.width = canvas.width;
    copy.height = canvas.height;

    const ctx = copy.getContext("2d");
    if (!ctx) return false;

    // JPEG doesn't support transparency, so we force a white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, copy.width, copy.height);
    ctx.drawImage(canvas, 0, 0);

    downloadDataUrl(copy.toDataURL("image/jpeg", 0.92), filename);
    return true;
  });
}

export async function exportWorkspaceAsPdf(workspaceId: string, filename = "workspace.pdf"): Promise<boolean> {
  return withSelectionHidden(workspaceId, async () => {
    const canvas = getStageCanvas();
    if (!canvas) return false;

    // Use PNG for PDF to preserve transparency/crispness
    const image = canvas.toDataURL("image/png", 1.0);
    const doc = new jsPDF({
      orientation: canvas.width >= canvas.height ? "landscape" : "portrait",
      unit: "pt",
      format: "a4"
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Calculate aspect ratio to fit image on A4 page
    const scale = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
    const renderWidth = canvas.width * scale;
    const renderHeight = canvas.height * scale;
    
    const offsetX = (pageWidth - renderWidth) / 2;
    const offsetY = (pageHeight - renderHeight) / 2;

    doc.addImage(image, "PNG", offsetX, offsetY, renderWidth, renderHeight);
    doc.save(filename);
    return true;
  });
}
import jsPDF from "jspdf";
import { getOrCreateWorkspaceStore } from "@/store/workspaceStore";

/**
 * Gets the actual Konva Stage canvas. 
 * Note: Konva uses multiple layers; querySelector selects the top-most visible one.
 */
function getStageCanvas(): HTMLCanvasElement | null {
  return document.querySelector(".konva-stage canvas");
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.click();
}

/**
 * Ensures the UI has rendered the "deselected" state before capturing.
 * This is crucial for Optimistic UI flow so transformer boxes don't appear in exports.
 */
function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve()); // Double frame for React state + Konva draw cycle
    });
  });
}

/**
 * Wrapper to hide selection transformers before export.
 * This ensures the exported image doesn't have the "Blue Selection Box" on it.
 */
async function withSelectionHidden<T>(workspaceId: string, task: () => Promise<T>): Promise<T> {
  const store = getOrCreateWorkspaceStore(workspaceId).getState();
  const previousSelection = store.selectedElementId;

  if (previousSelection) {
    store.setSelectedElementId(null);
    // Wait for Konva to clear the transformer from the canvas
    await nextFrame();
  }

  try {
    return await task();
  } finally {
    // Optimistically restore selection after export task starts/completes
    if (previousSelection) {
      store.setSelectedElementId(previousSelection);
    }
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
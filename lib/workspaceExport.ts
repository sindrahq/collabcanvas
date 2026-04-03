import jsPDF from "jspdf";
import { useWorkspaceStore } from "@/store/workspaceStore";

function getStageCanvas(): HTMLCanvasElement | null {
  return document.querySelector(".konva-stage canvas");
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.click();
}

function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

async function withSelectionHidden<T>(task: () => Promise<T>): Promise<T> {
  const store = useWorkspaceStore.getState();
  const previousSelection = store.selectedElementId;

  if (previousSelection) {
    store.setSelectedElementId(null);
    await nextFrame();
    await nextFrame();
  }

  try {
    return await task();
  } finally {
    if (previousSelection) {
      store.setSelectedElementId(previousSelection);
    }
  }
}

export async function exportWorkspaceAsPng(filename = "workspace.png"): Promise<boolean> {
  return withSelectionHidden(async () => {
    const canvas = getStageCanvas();
    if (!canvas) return false;
    downloadDataUrl(canvas.toDataURL("image/png"), filename);
    return true;
  });
}

export async function exportWorkspaceAsJpeg(filename = "workspace.jpeg"): Promise<boolean> {
  return withSelectionHidden(async () => {
    const canvas = getStageCanvas();
    if (!canvas) return false;

    const copy = document.createElement("canvas");
    copy.width = canvas.width;
    copy.height = canvas.height;

    const ctx = copy.getContext("2d");
    if (!ctx) return false;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, copy.width, copy.height);
    ctx.drawImage(canvas, 0, 0);

    downloadDataUrl(copy.toDataURL("image/jpeg", 0.92), filename);
    return true;
  });
}

export async function exportWorkspaceAsPdf(filename = "workspace.pdf"): Promise<boolean> {
  return withSelectionHidden(async () => {
    const canvas = getStageCanvas();
    if (!canvas) return false;

    const image = canvas.toDataURL("image/png");
    const doc = new jsPDF({
      orientation: canvas.width >= canvas.height ? "landscape" : "portrait",
      unit: "pt",
      format: "a4"
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
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

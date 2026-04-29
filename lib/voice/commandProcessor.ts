import { getOrCreateWorkspaceStore } from "@/store/workspaceStore";

export const processVoiceCommand = (workspaceId: string, transcript: string) => {
  const command = transcript.toLowerCase();
  const store = getOrCreateWorkspaceStore(workspaceId).getState();

  // Color Mapping
  if (command.includes("dark") || command.includes("black")) {
    store.setCanvasBackground("#121212");
    return "Setting dark mode";
  }
  if (command.includes("white") || command.includes("light")) {
    store.setCanvasBackground("#fffdf8");
    return "Setting light mode";
  }

  // Element Actions
  if (command.includes("delete this") || command.includes("remove this")) {
    store.deleteSelectedElement();
    return "Deleted element";
  }
  if (command.includes("duplicate") || command.includes("copy this")) {
    store.duplicateSelectedElement();
    return "Duplicated element";
  }

  // Tool Selection
  if (command.includes("pencil") || command.includes("draw")) {
    store.setActiveTool("pencil");
    return "Pencil tool active";
  }
  if (command.includes("select") || command.includes("pointer")) {
    store.setActiveTool("select");
    return "Selection tool active";
  }

  return null;
};

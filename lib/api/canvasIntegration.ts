import type {
  CanvasRole,
  CanvasTemplate,
  RoleAssignment,
  UploadedAsset,
} from "@/types/integration";

type ApiErrorBody = { error?: string };

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & ApiErrorBody;
  if (!response.ok) {
    throw new Error(body.error || `Request failed with status ${response.status}.`);
  }
  return body;
}

export async function fetchCanvasRoles(canvasId: string) {
  return readJson<{
    currentUserRole: CanvasRole;
    assignments: RoleAssignment[];
  }>(await fetch(`/api/roles/${encodeURIComponent(canvasId)}`, { cache: "no-store" }));
}

export async function updateCanvasRole(input: {
  canvasId: string;
  userId: string;
  role: Exclude<CanvasRole, "owner">;
}) {
  return readJson<{ assignment: RoleAssignment }>(
    await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  );
}

export async function fetchUploadedAssets() {
  return readJson<{ assets: UploadedAsset[] }>(
    await fetch("/api/uploads/list", { cache: "no-store" })
  );
}

export async function fetchCanvasTemplates() {
  return readJson<{ templates: CanvasTemplate[] }>(
    await fetch("/api/templates/list", { cache: "no-store" })
  );
}

export async function saveCanvasTemplate(input: {
  name: string;
  description?: string;
  elements: CanvasTemplate["elements"];
}) {
  return readJson<{ template: CanvasTemplate }>(
    await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  );
}

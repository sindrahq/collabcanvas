import type { CanvasElement } from "@/store/workspaceStore";

export type CanvasRole = "owner" | "editor" | "commenter" | "viewer";

export type RoleAssignment = {
  id: string;
  userId: string;
  displayName: string;
  role: Exclude<CanvasRole, "owner">;
};

export type UploadedAsset = {
  id: string;
  url: string;
  name: string;
  mimeType: string;
  createdAt?: string;
};

export type CanvasTemplate = {
  id: string;
  name: string;
  description?: string;
  previewUrl?: string;
  elements: CanvasElement[];
  createdAt: string;
};

export type RemoteCursor = {
  x: number;
  y: number;
  color: string;
  name?: string;
  updatedAt: number;
};

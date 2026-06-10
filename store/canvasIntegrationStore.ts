"use client";

import { create, type StoreApi, type UseBoundStore } from "zustand";
import type {
  CanvasRole,
  CanvasTemplate,
  RemoteCursor,
  RoleAssignment,
  UploadedAsset,
} from "@/types/integration";

type ResourceStatus = "idle" | "loading" | "ready" | "error";

export type CanvasIntegrationState = {
  currentUserRole: CanvasRole;
  roleAssignments: RoleAssignment[];
  assetList: UploadedAsset[];
  templateList: CanvasTemplate[];
  remoteCursors: Record<string, RemoteCursor>;
  roleStatus: ResourceStatus;
  assetStatus: ResourceStatus;
  templateStatus: ResourceStatus;
  roleError: string | null;
  assetError: string | null;
  templateError: string | null;
  setCurrentUserRole: (role: CanvasRole) => void;
  setRoleAssignments: (assignments: RoleAssignment[]) => void;
  updateRoleAssignment: (userId: string, role: Exclude<CanvasRole, "owner">) => void;
  setAssetList: (assets: UploadedAsset[]) => void;
  setTemplateList: (templates: CanvasTemplate[]) => void;
  addTemplate: (template: CanvasTemplate) => void;
  setRemoteCursor: (userId: string, cursor: RemoteCursor) => void;
  removeRemoteCursor: (userId: string) => void;
  pruneRemoteCursors: (olderThan: number) => void;
  setResourceState: (
    resource: "role" | "asset" | "template",
    status: ResourceStatus,
    error?: string | null
  ) => void;
  resetIntegrationState: () => void;
};

const stores = new Map<string, UseBoundStore<StoreApi<CanvasIntegrationState>>>();

function createCanvasIntegrationStore() {
  return create<CanvasIntegrationState>((set) => ({
    currentUserRole: "viewer",
    roleAssignments: [],
    assetList: [],
    templateList: [],
    remoteCursors: {},
    roleStatus: "idle",
    assetStatus: "idle",
    templateStatus: "idle",
    roleError: null,
    assetError: null,
    templateError: null,
    setCurrentUserRole: (currentUserRole) => set({ currentUserRole }),
    setRoleAssignments: (roleAssignments) => set({ roleAssignments }),
    updateRoleAssignment: (userId, role) =>
      set((state) => ({
        roleAssignments: state.roleAssignments.map((assignment) =>
          assignment.userId === userId ? { ...assignment, role } : assignment
        ),
      })),
    setAssetList: (assetList) => set({ assetList }),
    setTemplateList: (templateList) => set({ templateList }),
    addTemplate: (template) =>
      set((state) => ({ templateList: [template, ...state.templateList] })),
    setRemoteCursor: (userId, cursor) =>
      set((state) => ({
        remoteCursors: { ...state.remoteCursors, [userId]: cursor },
      })),
    removeRemoteCursor: (userId) =>
      set((state) => {
        const next = { ...state.remoteCursors };
        delete next[userId];
        return { remoteCursors: next };
      }),
    pruneRemoteCursors: (olderThan) =>
      set((state) => ({
        remoteCursors: Object.fromEntries(
          Object.entries(state.remoteCursors).filter(([, cursor]) => cursor.updatedAt >= olderThan)
        ),
      })),
    setResourceState: (resource, status, error = null) =>
      set({
        [`${resource}Status`]: status,
        [`${resource}Error`]: error,
      } as Partial<CanvasIntegrationState>),
    resetIntegrationState: () =>
      set({
        currentUserRole: "viewer",
        roleAssignments: [],
        assetList: [],
        templateList: [],
        remoteCursors: {},
        roleStatus: "idle",
        assetStatus: "idle",
        templateStatus: "idle",
        roleError: null,
        assetError: null,
        templateError: null,
      }),
  }));
}

export function useCanvasIntegrationStoreFactory(canvasId: string) {
  const key = canvasId || "default";
  if (!stores.has(key)) {
    stores.set(key, createCanvasIntegrationStore());
  }
  return stores.get(key)!;
}

"use client";

import { useCallback, useEffect } from "react";
import {
  fetchCanvasRoles,
  fetchCanvasTemplates,
  fetchUploadedAssets,
  saveCanvasTemplate,
  updateCanvasRole,
} from "@/lib/api/canvasIntegration";
import { useCanvasIntegrationStoreFactory } from "@/store/canvasIntegrationStore";
import type { CanvasRole } from "@/types/integration";
import type { CanvasElement } from "@/store/workspaceStore";

export function useCanvasIntegration(canvasId: string, enabled = true) {
  const store = useCanvasIntegrationStoreFactory(canvasId);

  const refreshRoles = useCallback(async () => {
    if (!canvasId || !enabled || canvasId.startsWith("local-")) return;
    store.getState().setResourceState("role", "loading");
    try {
      const result = await fetchCanvasRoles(canvasId);
      store.getState().setCurrentUserRole(result.currentUserRole);
      store.getState().setRoleAssignments(result.assignments);
      store.getState().setResourceState("role", "ready");
    } catch (error) {
      store.getState().setResourceState(
        "role",
        "error",
        error instanceof Error ? error.message : "Could not load roles."
      );
    }
  }, [canvasId, enabled, store]);

  const refreshAssets = useCallback(async () => {
    if (!enabled) return;
    store.getState().setResourceState("asset", "loading");
    try {
      const result = await fetchUploadedAssets();
      store.getState().setAssetList(result.assets);
      store.getState().setResourceState("asset", "ready");
    } catch (error) {
      store.getState().setResourceState(
        "asset",
        "error",
        error instanceof Error ? error.message : "Could not load assets."
      );
    }
  }, [enabled, store]);

  const refreshTemplates = useCallback(async () => {
    if (!enabled) return;
    store.getState().setResourceState("template", "loading");
    try {
      const result = await fetchCanvasTemplates();
      store.getState().setTemplateList(result.templates);
      store.getState().setResourceState("template", "ready");
    } catch (error) {
      store.getState().setResourceState(
        "template",
        "error",
        error instanceof Error ? error.message : "Could not load templates."
      );
    }
  }, [enabled, store]);

  useEffect(() => {
    void refreshRoles();
    void refreshAssets();
    void refreshTemplates();
  }, [refreshAssets, refreshRoles, refreshTemplates]);

  const updateRoleOptimistically = useCallback(
    async (userId: string, role: Exclude<CanvasRole, "owner">) => {
      const previous = store.getState().roleAssignments.find((item) => item.userId === userId);
      store.getState().updateRoleAssignment(userId, role);
      try {
        const result = await updateCanvasRole({ canvasId, userId, role });
        store.getState().updateRoleAssignment(result.assignment.userId, result.assignment.role);
        window.dispatchEvent(new CustomEvent("collabcanvas:role-change", {
          detail: { canvasId, userId: result.assignment.userId, role: result.assignment.role },
        }));
        return result.assignment;
      } catch (error) {
        if (previous) store.getState().updateRoleAssignment(userId, previous.role);
        throw error;
      }
    },
    [canvasId, store]
  );

  const saveTemplate = useCallback(
    async (name: string, elements: CanvasElement[]) => {
      store.getState().setResourceState("template", "loading");
      try {
        const result = await saveCanvasTemplate({ name, elements });
        store.getState().addTemplate(result.template);
        store.getState().setResourceState("template", "ready");
        return result.template;
      } catch (error) {
        store.getState().setResourceState(
          "template",
          "error",
          error instanceof Error ? error.message : "Could not save template."
        );
        throw error;
      }
    },
    [store]
  );

  return {
    store,
    refreshRoles,
    refreshAssets,
    refreshTemplates,
    updateRoleOptimistically,
    saveTemplate,
  };
}

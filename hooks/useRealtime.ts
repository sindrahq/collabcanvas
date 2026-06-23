"use client";

import { useCallback, useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useCanvasIntegrationStoreFactory } from "@/store/canvasIntegrationStore";
import type { CanvasRole } from "@/types/integration";

type CursorMovePayload = {
  userId: string;
  x: number;
  y: number;
  color: string;
  name?: string;
};

type RoleChangePayload = {
  userId: string;
  role: Exclude<CanvasRole, "owner">;
};

export function useRealtime({
  canvasId,
  currentUser,
  onCanvasUpdate,
}: {
  canvasId: string;
  currentUser: { id: string; color: string; name: string } | null;
  onCanvasUpdate?: () => void;
}) {
  const store = useCanvasIntegrationStoreFactory(canvasId);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const cursorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCursorRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!canvasId || canvasId.startsWith("local-")) return;
    const client = createSupabaseBrowserClient();
    if (!client) return;

    const channel = client
      .channel(`canvas:${canvasId}`, { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "cursor-move" }, ({ payload }) => {
        const cursor = payload as CursorMovePayload;
        if (!cursor?.userId || cursor.userId === currentUser?.id) return;
        store.getState().setRemoteCursor(cursor.userId, {
          x: cursor.x,
          y: cursor.y,
          color: cursor.color || "#D3A5B1",
          name: cursor.name,
          updatedAt: Date.now(),
        });
      })
      .on("broadcast", { event: "canvas-update" }, () => {
        onCanvasUpdate?.();
      })
      .on("broadcast", { event: "role-change" }, ({ payload }) => {
        const change = payload as RoleChangePayload;
        if (!change?.userId || !change.role) return;
        store.getState().updateRoleAssignment(change.userId, change.role);
        if (change.userId === currentUser?.id) {
          store.getState().setCurrentUserRole(change.role);
        }
      })
      .subscribe();

    channelRef.current = channel;
    const handleLocalRoleChange = (event: Event) => {
      const detail = (event as CustomEvent<RoleChangePayload & { canvasId: string }>).detail;
      if (detail.canvasId !== canvasId) return;
      void channel.send({
        type: "broadcast",
        event: "role-change",
        payload: { userId: detail.userId, role: detail.role } satisfies RoleChangePayload,
      });
    };
    window.addEventListener("collabcanvas:role-change", handleLocalRoleChange);
    const pruneTimer = window.setInterval(() => {
      store.getState().pruneRemoteCursors(Date.now() - 5000);
    }, 2000);

    return () => {
      window.removeEventListener("collabcanvas:role-change", handleLocalRoleChange);
      window.clearInterval(pruneTimer);
      if (cursorTimerRef.current) window.clearTimeout(cursorTimerRef.current);
      cursorTimerRef.current = null;
      pendingCursorRef.current = null;
      channelRef.current = null;
      void client.removeChannel(channel);
    };
  }, [canvasId, currentUser?.id, onCanvasUpdate, store]);

  const sendCursor = useCallback(
    (x: number, y: number) => {
      if (!currentUser || !channelRef.current) return;
      pendingCursorRef.current = { x, y };
      if (cursorTimerRef.current) return;

      cursorTimerRef.current = setTimeout(() => {
        cursorTimerRef.current = null;
        const cursor = pendingCursorRef.current;
        pendingCursorRef.current = null;
        if (!cursor || !channelRef.current) return;
        void channelRef.current.send({
          type: "broadcast",
          event: "cursor-move",
          payload: {
            userId: currentUser.id,
            color: currentUser.color,
            name: currentUser.name,
            ...cursor,
          } satisfies CursorMovePayload,
        });
      }, 100);
    },
    [currentUser]
  );

  const broadcastCanvasUpdate = useCallback(() => {
    void channelRef.current?.send({
      type: "broadcast",
      event: "canvas-update",
      payload: { userId: currentUser?.id, updatedAt: Date.now() },
    });
  }, [currentUser?.id]);

  const broadcastRoleChange = useCallback((payload: RoleChangePayload) => {
    void channelRef.current?.send({
      type: "broadcast",
      event: "role-change",
      payload,
    });
  }, []);

  return { sendCursor, broadcastCanvasUpdate, broadcastRoleChange };
}

import { useCallback, useEffect } from 'react';
const throttle = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout | null = null;
  let lastArgs: any;
  return (...args: any[]) => {
    if (!timeout) {
      func(...args);
      timeout = setTimeout(() => {
        timeout = null;
        if (lastArgs) {
          func(...lastArgs);
          lastArgs = null;
        }
      }, wait);
    } else {
      lastArgs = args;
    }
  };
};
import {
  broadcastCursor,
  broadcastSelection,
  broadcastTyping,
  broadcastViewport,
  onCursorBroadcast,
  onSelectionBroadcast,
  onTypingBroadcast,
  onViewportBroadcast,
  PresenceMeta,
} from '@/lib/collaboration';
import { usePresenceStore } from '@/store/presenceStore';

// Helper to get local user id from store
const useLocalUserId = () => usePresenceStore((s) => s.localUserId);

export function usePresenceEmitters() {
  const localUserId = useLocalUserId();
  const updateUser = usePresenceStore((s) => s.updateUser);

  // Throttled cursor emitter (50ms)
  const sendCursor = useCallback(
    throttle((x: number, y: number) => {
      broadcastCursor(localUserId, x, y);
    }, 50),
    [localUserId]
  );

  const sendSelection = useCallback((elementId: string | null) => {
    broadcastSelection(localUserId, elementId);
  }, [localUserId]);

  const sendTyping = useCallback((isTyping: boolean) => {
    broadcastTyping(localUserId, isTyping);
  }, [localUserId]);

  const sendViewport = useCallback((zoom: number, panX: number, panY: number) => {
    broadcastViewport(localUserId, zoom, panX, panY);
  }, [localUserId]);

  // Register inbound listeners once
  useEffect(() => {
    const cleanupCursor = onCursorBroadcast((payload) => {
      const { user_id, x, y } = payload;
      if (user_id === localUserId) return; // ignore self
      updateUser(user_id, { cursor: { x, y } });
    });
    const cleanupSelection = onSelectionBroadcast((payload) => {
      const { user_id, element_id } = payload;
      if (user_id === localUserId) return;
      updateUser(user_id, { selection: element_id });
    });
    const cleanupTyping = onTypingBroadcast((payload) => {
      const { user_id, typing } = payload;
      if (user_id === localUserId) return;
      updateUser(user_id, { typing });
    });
    const cleanupViewport = onViewportBroadcast((payload) => {
      const { user_id, zoom, panX, panY } = payload;
      if (user_id === localUserId) return;
      updateUser(user_id, { viewport: { zoom, panX, panY } });
    });
    return () => {
      cleanupCursor();
      cleanupSelection();
      cleanupTyping();
      cleanupViewport();
    };
  }, [localUserId, updateUser]);

  return { sendCursor, sendSelection, sendTyping, sendViewport };
}

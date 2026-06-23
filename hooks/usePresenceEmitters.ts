import { useCallback, useEffect, useMemo } from 'react';
const throttle = <T extends unknown[]>(func: (...args: T) => void, wait: number) => {
  let timeout: NodeJS.Timeout | null = null;
  let lastArgs: T | null = null;
  return (...args: T) => {
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
  acquireSelectionLock,
  broadcastCursor,
  broadcastTyping,
  broadcastViewport,
  onCursorBroadcast,
  onSelectionBroadcast,
  onTypingBroadcast,
  onViewportBroadcast,
} from '@/lib/collaboration';
import { usePresenceStore } from '@/store/presenceStore';

// Helper to get local user id from store
const useLocalUserId = () => usePresenceStore((s) => s.localUserId);

export function usePresenceEmitters() {
  const localUserId = useLocalUserId();
  const updateUser = usePresenceStore((s) => s.updateUser);

  // Throttled cursor emitter (50ms)
  const sendCursor = useMemo(
    () => throttle((x: number, y: number) => {
      broadcastCursor(localUserId, x, y);
    }, 50),
    [localUserId]
  );

  const sendSelection = useCallback((elementId: string | null) => {
    acquireSelectionLock(localUserId, elementId);
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
      const { userId, isTyping } = payload;
      if (userId === localUserId) return;
      updateUser(userId, { typing: isTyping });
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

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from './supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

type User = { id: string; name?: string; color?: string } | null;

type CursorPayload = {
  userId: string;
  x: number;
  y: number;
  userName?: string;
  color?: string;
};

type BroadcastChannel = RealtimeChannel & {
  on(
    type: 'broadcast',
    filter: { event: string },
    callback: (response: { payload?: CursorPayload }) => void
  ): RealtimeChannel;
};

export function useLiveCursor(
  workspaceId: string | null | undefined,
  user: User,
  onRemoteMove: (p: CursorPayload) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    const topic = `room:${workspaceId}`;
    const channel = supabase.channel(topic, { config: { broadcast: { self: true } } });
    channelRef.current = channel;

    // Presence tracking (optional) - helps other clients learn who's available.
    if (user) {
      channel
        .track({ user_id: user.id, name: user.name ?? '', color: user.color ?? '' })
        .catch(() => undefined);
    }

    // Listen for remote mouse movements
    (channel as BroadcastChannel).on('broadcast', { event: 'mouse-move' }, (response) => {
      const payload = response.payload as CursorPayload;
      if (!payload) return;
      // Ignore own echoes by `userId` (client may still receive its own broadcast)
      if (user && payload.userId === user.id) return;
      onRemoteMove(payload);
    });

    channel.subscribe(() => {
      // no-op; could be used for logging
    });

    return () => {
      try {
        channel.unsubscribe();
      } catch {
        // ignore
      }
      channelRef.current = null;
    };
  }, [workspaceId, user, onRemoteMove]);

  const sendCursor = useCallback(
    (x: number, y: number) => {
      const channel = channelRef.current;
      if (!channel || !user || !workspaceId) return;

      const payload: CursorPayload = {
        userId: user.id,
        x,
        y,
        userName: user.name ?? undefined,
        color: user.color ?? undefined,
      };

      // direct client broadcast
      channel.send({ type: 'broadcast', event: 'mouse-move', payload });
    },
    [user, workspaceId]
  );

  return { sendCursor };
}

// Supabase Realtime Broadcast setup for activity feed (browser)
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ActivityPayload = Record<string, unknown>;
type BroadcastPayload<T> = { payload?: T };

export function subscribeToActivityFeed(workspaceId: string, onActivity: (activity: ActivityPayload) => void) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return () => {};

  const channel = supabase.channel(`activity_feed:${workspaceId}`);

  channel.on('broadcast', { event: 'activity' }, (payload: BroadcastPayload<ActivityPayload>) => {
    try {
      if (payload.payload) onActivity(payload.payload);
    } catch {
      // swallow
    }
  });

  void channel.subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function broadcastActivity(workspaceId: string, activity: ActivityPayload) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return;
  void supabase.channel(`activity_feed:${workspaceId}`).send({ type: 'broadcast', event: 'activity', payload: activity });
}

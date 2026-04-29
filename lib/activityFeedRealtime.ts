// Supabase Realtime Broadcast setup for activity feed (browser)
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function subscribeToActivityFeed(workspaceId: string, onActivity: (activity: any) => void) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return () => {};

  const channel = supabase.channel(`activity_feed:${workspaceId}`);

  channel.on('broadcast', { event: 'activity' }, (payload: any) => {
    try {
      onActivity(payload.payload);
    } catch (e) {
      // swallow
    }
  });

  void channel.subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function broadcastActivity(workspaceId: string, activity: any) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return;
  void supabase.channel(`activity_feed:${workspaceId}`).send({ type: 'broadcast', event: 'activity', payload: activity });
}

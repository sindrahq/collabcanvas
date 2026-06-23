import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { PresenceMeta } from '@/lib/collaboration';

export interface PresenceState {
  users: Record<string, PresenceMeta>;
  // ID of the user whose viewport is being followed, or null
  followedUserId: string | null;
  // Local user's meta (used for broadcasting)
  localUserId: string;
}

type PresenceActions = {
  setLocalUserId: (id: string) => void;
  updateUser: (userId: string, meta: Partial<PresenceMeta>) => void;
  removeUser: (userId: string) => void;
  setFollowedUser: (userId: string | null) => void;
};

export const usePresenceStore = create<PresenceState & PresenceActions>()(
  devtools(
    immer((set) => ({
      users: {},
      followedUserId: null,
      localUserId: 'local',
      setLocalUserId: (id) => set((state) => { state.localUserId = id; }),
      updateUser: (userId, meta) =>
        set((state) => {
          const existing = state.users[userId] ?? {};
          state.users[userId] = { ...existing, ...meta } as PresenceMeta;
        }),
      removeUser: (userId) =>
        set((state) => {
          delete state.users[userId];
          if (state.followedUserId === userId) state.followedUserId = null;
        }),
      setFollowedUser: (userId) =>
        set((state) => {
          state.followedUserId = userId;
        }),
    }))
  ));

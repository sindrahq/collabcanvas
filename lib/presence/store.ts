// lib/presence/store.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { PresenceMap, RemoteUserPresence } from '@/lib/presence/types';

interface PresenceState {
  // map of userId -> presence data
  users: PresenceMap;
  // local user id for easier reference
  localUserId: string | null;
  // actions
  setLocalUserId: (id: string) => void;
  upsertUser: (presence: RemoteUserPresence) => void;
  removeUser: (userId: string) => void;
  reset: () => void;
}

export const usePresenceStore = create<PresenceState>()(
  immer((set) => ({
    users: {},
    localUserId: null,
    setLocalUserId: (id) => set((state) => { state.localUserId = id; }),
    upsertUser: (presence) =>
      set((state) => {
        state.users[presence.userId] = presence;
      }),
    removeUser: (userId) =>
      set((state) => {
        delete state.users[userId];
      }),
    reset: () =>
      set(() => ({ users: {}, localUserId: null })),
  }))
);

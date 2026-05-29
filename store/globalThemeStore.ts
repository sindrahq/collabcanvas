import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CanvasTheme } from "./workspaceStore";

export const THEME_BACKGROUNDS: Record<CanvasTheme, string> = {
  cherry: "https://images.unsplash.com/photo-1522228115018-d838bcce5c38?q=80&w=2500&auto=format&fit=crop",
  forest: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2500&auto=format&fit=crop",
  ocean: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=2500&auto=format&fit=crop",
  sunset: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2500&auto=format&fit=crop",
};

export type GlobalThemeState = {
  theme: CanvasTheme;
  setTheme: (theme: CanvasTheme) => void;
};

export const useGlobalThemeStore = create<GlobalThemeState>()(
  persist(
    (set) => ({
      theme: "cherry",
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "collabcanvas-global-theme",
    }
  )
);

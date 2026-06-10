export interface CursorPosition {
  x: number;
  y: number;
}

export interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
}

export interface RemoteUserPresence {
  userId: string;
  name: string;
  color: string; // hex color string
  cursor: CursorPosition;
  selection: string | null; // elementId
  typing: boolean;
  viewport: ViewportState;
}

export type PresenceMap = Record<string, RemoteUserPresence>;

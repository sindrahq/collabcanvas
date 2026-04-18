// Types for canvas elements as stored in PostgreSQL
export interface CanvasElement {
  id: string;
  workspace_id: string;
  type: 'rectangle' | 'circle' | 'text';
  position: { x: number; y: number; width: number; height: number };
  rotation?: number;
  text_content?: string | null;
  style: {
    fill: string;
    stroke: string;
    strokeWidth: number;
    opacity: number;
    fontSize?: number;
  };
  style_ext?: Record<string, unknown> | null;
  layer_order: number;
  visible: boolean;
  locked: boolean;
}

// Types for workspace metadata
export interface WorkspaceMeta {
  id: string;
  name: string;
  owner_id: string;
}

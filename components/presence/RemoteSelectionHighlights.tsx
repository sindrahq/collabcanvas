import React from 'react';
import { usePresenceStore } from '@/store/presenceStore';
import { useWorkspaceStoreFactory } from '@/store/workspaceStore';
import { Stage, Layer, Rect, Text } from 'react-konva';

/**
 * Draws a transparent bounding box around the element that another user has selected.
 * The component reads the global presence store for each user's `selection` field
 * (the elementId) and fetches the element's geometry from the workspace store.
 */
export const RemoteSelectionHighlights: React.FC<{ workspaceId: string }> = ({ workspaceId }) => {
  const users = usePresenceStore((s) => s.users);
  const useWorkspaceStore = useWorkspaceStoreFactory(workspaceId);
  const elements = useWorkspaceStore((s) => s.elements);

  // Build an array of highlights to render
  const highlights = Object.entries(users)
    .filter(([, meta]) => meta.selection)
    .map(([userId, meta]) => {
      const element = elements.find((e) => e.id === meta.selection);
      if (!element) return null;
      const { x, y, width, height } = element;
      const left = x / 1.6; // STAGE_SCALE constant from konva-stage
      const top = y / 1.6;
      const w = width / 1.6;
      const h = height / 1.6;
      return { userId, name: meta.name, color: meta.color, left, top, w, h };
    })
    .filter((h): h is { userId: string; name: string; color: string; left: number; top: number; w: number; h: number } => Boolean(h))

  if (highlights.length === 0) return null;

  return (
    <Stage width={0} height={0} listening={false} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <Layer>
        {highlights.map((h) => (
          <React.Fragment key={h.userId}>
            <Rect
              x={h.left}
              y={h.top}
              width={h.w}
              height={h.h}
              stroke={h.color}
              strokeWidth={2}
              dash={[4, 4]}
            />
            <Rect
              x={h.left}
              y={h.top - 20}
              width={120}
              height={20}
              fill={h.color}
              opacity={0.8}
            />
            <Text
              x={h.left + 4}
              y={h.top - 18}
              text={`${h.name} is editing…`}
              fontSize={12}
              fill="#fff"
            />
          </React.Fragment>
        ))}
      </Layer>
    </Stage>
  );
};

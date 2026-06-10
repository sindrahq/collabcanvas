import React from 'react';
import { usePresenceStore } from '@/store/presenceStore';

/**
 * Shows a small animated typing indicator (three bouncing dots) next to the
 * remote user’s cursor when `typing` is true.
 */
export const TypingIndicator: React.FC = () => {
  const users = usePresenceStore((s) => s.users);
  const localId = usePresenceStore((s) => s.localUserId);

  return (
    <>
      {Object.entries(users)
        .filter(([id, meta]) => id !== localId && meta.typing)
        .map(([id, meta]) => (
          <div
            key={id}
            className="absolute flex items-center space-x-1"
            style={{
              left: `${meta.cursor.x * 100}%`,
              top: `${meta.cursor.y * 100}%`,
              transform: 'translate(-50%, -150%)',
            }}
          >
            <span
              className="w-2 h-2 rounded-full bg-current animate-bounce"
              style={{ animationDelay: '0s', color: meta.color }}
            />
            <span
              className="w-2 h-2 rounded-full bg-current animate-bounce"
              style={{ animationDelay: '0.2s', color: meta.color }}
            />
            <span
              className="w-2 h-2 rounded-full bg-current animate-bounce"
              style={{ animationDelay: '0.4s', color: meta.color }}
            />
          </div>
        ))}
    </>
  );
};

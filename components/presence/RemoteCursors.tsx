"use client";

import type { PresenceMeta } from "@/lib/collaboration";

type CursorPoint = { x: number; y: number; updatedAt: number };

type RemoteCursorsProps = {
	cursors: Record<string, CursorPoint>;
	presences: Record<string, PresenceMeta>;
	currentUserId: string;
};

const CURSOR_TTL_MS = 9000;

export function RemoteCursors({ cursors, presences, currentUserId }: RemoteCursorsProps) {
	const now = Date.now();

	return (
		<div className="remote-cursors-layer" aria-hidden="true">
			{Object.entries(cursors).map(([userId, point]) => {
				if (userId === currentUserId) return null;
				if (now - point.updatedAt > CURSOR_TTL_MS) return null;

				const meta = presences[userId];
				if (!meta) return null;

				return (
					<div
						key={userId}
						className="remote-cursor"
						style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
					>
						<div className="remote-cursor-dot" style={{ background: meta.color }} />
						<div className="remote-cursor-label" style={{ borderColor: meta.color }}>
							{meta.name}
						</div>
					</div>
				);
			})}
		</div>
	);
}


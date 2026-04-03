"use client";

import type { PresenceMeta } from "@/lib/collaboration";

type AvatarStackProps = {
	presences: Record<string, PresenceMeta>;
	currentUserId: string;
};

export function AvatarStack({ presences, currentUserId }: AvatarStackProps) {
	const collaborators = Object.values(presences)
		.filter((presence) => presence.user_id !== currentUserId)
		.slice(0, 5);

	return (
		<div className="avatar-stack-wrap" aria-label="Collaborators online">
			<div className="avatar-stack">
				{collaborators.map((presence) => (
					<div
						key={presence.user_id}
						className="avatar-chip"
						style={{ background: presence.color }}
						title={presence.name}
					>
						{presence.name.trim().slice(0, 1).toUpperCase()}
					</div>
				))}
			</div>
			<span className="avatar-count">{Object.keys(presences).length} live</span>
		</div>
	);
}


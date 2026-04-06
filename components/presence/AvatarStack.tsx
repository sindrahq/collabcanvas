"use client";

import type { PresenceMeta } from "@/lib/collaboration";

type AvatarStackProps = {
	presences: Record<string, PresenceMeta>;
	currentUserId: string;
};

export function AvatarStack({ presences, currentUserId }: AvatarStackProps) {
	const collaborators = Object.values(presences)
		.filter((presence) => presence && presence.user_id !== currentUserId)
		.slice(0, 5);

	return (
		<div className="avatar-stack-wrap" aria-label="Collaborators online">
			<div className="avatar-stack">
				{collaborators.map((presence) => {
					const rawName = typeof presence.name === "string" ? presence.name.trim() : "";
					const displayName = rawName || "Guest";
					const initial = displayName.slice(0, 1).toUpperCase();

					return (
						<div
							key={presence.user_id || displayName}
							className="avatar-chip"
							style={{ background: presence.color || "#8b7355" }}
							title={displayName}
						>
							{initial}
						</div>
					);
				})}
			</div>
			<span className="avatar-count">{Object.keys(presences).length} live</span>
		</div>
	);
}


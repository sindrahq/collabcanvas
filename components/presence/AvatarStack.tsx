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
					const avatarUrl = typeof presence.avatarUrl === "string" ? presence.avatarUrl.trim() : "";

					return (
						<div
							key={presence.user_id || displayName}
							className="avatar-chip relative"
							style={{ background: presence.color || "#FF94B4" }}
							title={displayName}
						>
							{avatarUrl ? (
								<img src={avatarUrl} alt={displayName} className="avatar-chip-image relative z-10" />
							) : (
								<span className="relative z-10">{initial}</span>
							)}
						</div>
					);
				})}
			</div>
			<span className="avatar-count">{Object.keys(presences).length} live</span>
		</div>
	);
}

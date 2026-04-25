"use client";

import type { PresenceMeta } from "@/lib/collaboration";
import { useState, useEffect } from "react";
import { AudioIndicator } from "./AudioIndicator";
import { Mic } from "lucide-react";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";

type AvatarStackProps = {
	presences: Record<string, PresenceMeta>;
	currentUserId: string;
};

function LiveKitConnection({ room, identity }: { room: string; identity: string }) {
	const [token, setToken] = useState("");

	useEffect(() => {
		(async () => {
			try {
				const resp = await fetch(`/api/livekit?room=${encodeURIComponent(room)}&identity=${encodeURIComponent(identity)}`);
				const data = await resp.json();
				if (data.token) {
					setToken(data.token);
				}
			} catch (e) {
				console.error("LiveKit token error:", e);
			}
		})();
	}, [room, identity]);

	if (!token) return null;

	return (
		<LiveKitRoom
			token={token}
			serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
			connect={true}
			audio={true}
		>
			<RoomAudioRenderer />
		</LiveKitRoom>
	);
}

export function AvatarStack({ presences, currentUserId }: AvatarStackProps) {
	const [activeVoiceUser, setActiveVoiceUser] = useState<string | null>(null);

	const collaborators = Object.values(presences)
		.filter((presence) => presence && presence.user_id !== currentUserId)
		.slice(0, 5);

	const currentRoom = activeVoiceUser 
		? `voice-${[currentUserId, activeVoiceUser].sort().join("-")}` 
		: null;

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
							className={`avatar-chip relative cursor-pointer transition-transform hover:scale-110 ${activeVoiceUser === presence.user_id ? " ring-2 ring-indigo-500" : ""}`}
							style={{ background: presence.color || "#FF94B4" }}
							title={`Click to start voice chat with ${displayName}`}
							onClick={() => setActiveVoiceUser(activeVoiceUser === presence.user_id ? null : presence.user_id)}
						>
							<AudioIndicator active={activeVoiceUser === presence.user_id} />
							{avatarUrl ? (
								<img src={avatarUrl} alt={displayName} className="avatar-chip-image relative z-10" />
							) : (
								<span className="relative z-10">{initial}</span>
							)}
							{activeVoiceUser === presence.user_id && (
								<div className="absolute -bottom-1 -right-1 z-20 rounded-full bg-indigo-500 p-0.5 text-white">
									<Mic size={8} />
								</div>
							)}
						</div>
					);
				})}
			</div>
			<span className="avatar-count">{Object.keys(presences).length} live</span>

			{currentRoom && (
				<LiveKitConnection room={currentRoom} identity={currentUserId} />
			)}
		</div>
	);
}


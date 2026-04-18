import { supabase } from './supabaseClient';

// Types for user presence metadata
export interface PresenceMeta {
	user_id: string;
	name: string;
	color: string;
	avatarUrl: string;
	cursor: { x: number; y: number };
}

// Presence channel instance (singleton)
let presenceChannel: ReturnType<typeof supabase.channel> | null = null;

// Cursor broadcast listeners
type CursorListener = (payload: CursorBroadcast) => void;
let cursorListeners: CursorListener[] = [];

type PresenceState = Record<string, PresenceMeta>;
type PresenceJoinPayload = { key: string; newPresences: PresenceMeta[] };
type PresenceLeavePayload = { key: string };
type CursorBroadcastPayload = { payload: CursorBroadcast };
type PresenceEventMeta = {
	onSync?: (presences: PresenceState) => void;
	onJoin?: (userId: string, meta: PresenceMeta) => void;
	onLeave?: (userId: string) => void;
};

// Throttle utility
function throttle<T extends (...args: any[]) => void>(fn: T, ms: number): T {
	let last = 0;
	let timeout: ReturnType<typeof setTimeout> | null = null;
	let latestArgs: any[];
	return function(this: any, ...args: any[]) {
		const now = Date.now();
		latestArgs = args;
		if (now - last >= ms) {
			last = now;
			fn.apply(this, args);
		} else if (!timeout) {
			timeout = setTimeout(() => {
				last = Date.now();
				timeout = null;
				fn.apply(this, latestArgs);
			}, ms - (now - last));
		}
	} as T;
}

// Cursor broadcast payload
export interface CursorBroadcast {
	user_id: string;
	x: number; // normalized [0, 1]
	y: number; // normalized [0, 1]
}

/**
 * Initialize the presence channel for a workspace.
 * @param workspaceId The workspace (room) ID
 * @param meta The current user's presence metadata
 * @param onSync Callback when presence state is updated
 */
export function initPresenceChannel(
	workspaceId: string,
	meta: PresenceMeta,
	events: PresenceEventMeta
) {
	if (presenceChannel) {
		presenceChannel.unsubscribe();
		presenceChannel = null;
	}
	cursorListeners = [];

	const flattenPresenceState = (): PresenceState => {
		const state = presenceChannel!.presenceState() as Record<string, PresenceMeta[]>;
		const flat: PresenceState = {};
		Object.entries(state).forEach(([user_id, arr]) => {
			if (arr && arr.length > 0) flat[user_id] = arr[0];
		});
		return flat;
	};

	presenceChannel = supabase.channel(`presence-${workspaceId}`, {
		config: { presence: { key: meta.user_id } }
	});

	// Listen for presence sync events
	presenceChannel.on('presence', { event: 'sync' }, () => {
		events.onSync?.(flattenPresenceState());
	});

	presenceChannel.on('presence', { event: 'join' }, ({ key, newPresences }: PresenceJoinPayload) => {
		const incoming = (newPresences as unknown as PresenceMeta[] | undefined)?.[0];
		if (incoming) {
			events.onJoin?.(key, incoming);
		}
	});

	presenceChannel.on('presence', { event: 'leave' }, ({ key }: PresenceLeavePayload) => {
		events.onLeave?.(key);
	});

	// Attach cursor broadcast handler here (fixes TS error)
	presenceChannel.on('broadcast', { event: 'cursor' }, ({ payload }: CursorBroadcastPayload) => {
		cursorListeners.forEach((fn) => fn(payload));
	});

	// Subscribe to the channel
	presenceChannel.subscribe((status: string) => {
		if (status === 'SUBSCRIBED') {
			presenceChannel?.track(meta);
		}
	});
}

/**
 * Update the current user's presence metadata (e.g., cursor position).
 */
export function updatePresence(meta: Partial<PresenceMeta>) {
	if (presenceChannel) {
		presenceChannel.track(meta);
	}
}

/**
 * Broadcast normalized cursor position to the channel (ephemeral, not persisted).
 * @param user_id
 * @param x Normalized x (0-1)
 * @param y Normalized y (0-1)
 */
export const broadcastCursor = throttle((user_id: string, x: number, y: number) => {
	if (presenceChannel) {
		presenceChannel.send({
			type: 'broadcast',
			event: 'cursor',
			payload: { user_id, x, y }
		});
	}
}, 20); 

export function onCursorBroadcast(listener: CursorListener) {
	cursorListeners.push(listener);

	return () => {
		cursorListeners = cursorListeners.filter((fn) => fn !== listener);
	};
}



export function normalizeCoords(x: number, y: number, canvasRect: DOMRect): { x: number; y: number } {
	return {
		x: (x - canvasRect.left) / canvasRect.width,
		y: (y - canvasRect.top) / canvasRect.height
	};
}


export function denormalizeCoords(x: number, y: number, canvasRect: DOMRect): { x: number; y: number } {
	return {
		x: x * canvasRect.width + canvasRect.left,
		y: y * canvasRect.height + canvasRect.top
	};
}

/**
 * Clean up the presence channel (leave room, remove cursor/avatar).
 */
export function leavePresenceChannel() {
	if (presenceChannel) {
		presenceChannel.unsubscribe();
		presenceChannel = null;
	}
	cursorListeners = [];
}

// Ensure cleanup on tab close or reload
if (typeof window !== 'undefined') {
	window.addEventListener('beforeunload', () => {
		leavePresenceChannel();
	});
}

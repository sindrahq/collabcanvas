import { supabase } from './supabaseClient';

// Types for user presence metadata
export interface PresenceMeta {
  user_id: string;
  name: string;
  color: string;
  avatarUrl: string;
  cursor: { x: number; y: number };
  // New fields for collaboration
  selection: string | null; // elementId currently selected by the user
  typing: boolean; // true when user is typing in a text field
  viewport: { zoom: number; panX: number; panY: number }; // current canvas view
}

// Presence channel instance (singleton)
let presenceChannel: ReturnType<typeof supabase.channel> | null = null;

// Cursor broadcast listeners
type CursorListener = (payload: CursorBroadcast) => void;
let cursorListeners: CursorListener[] = [];

// Camera sync listeners
type CameraSyncListener = (payload: CameraSyncBroadcastPayload) => void;
let cameraSyncListeners: CameraSyncListener[] = [];

// Element click broadcast listeners (collaborative elevation)
export interface ElementClickBroadcast {
  user_id: string;
  element_id: string;
}
type ElementClickListener = (payload: ElementClickBroadcast) => void;
let elementClickListeners: ElementClickListener[] = [];

type PresenceState = Record<string, PresenceMeta>;
type PresenceJoinPayload = { key: string; newPresences: PresenceMeta[] };
type PresenceLeavePayload = { key: string };
type CursorBroadcastPayload = { payload: CursorBroadcast };
export type SelectionBroadcastPayload = { user_id: string; element_id: string | null };
export type TypingStatusBroadcastPayload = { userId: string; isTyping: boolean };
export type CameraSyncBroadcastPayload = {
	presenterId: string;
	clientX: number;
	clientY: number;
	zoomScale: number;
};
export type SelectionLockResult = { ok: true } | { ok: false; lockedBy: string };
type PresenceEventMeta = {
	onSync?: (presences: PresenceState) => void;
	onJoin?: (userId: string, meta: PresenceMeta) => void;
	onLeave?: (userId: string) => void;
};

// Throttle utility
function throttle<T extends (...args: Parameters<T>) => void>(fn: T, ms: number): T {
	let last = 0;
	let timeout: ReturnType<typeof setTimeout> | null = null;
	let latestArgs: Parameters<T>;
	return function(this: unknown, ...args: Parameters<T>) {
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

function flattenChannelPresenceState(): PresenceState {
	if (!presenceChannel) return {};
	const state = presenceChannel.presenceState() as Record<string, PresenceMeta[]>;
	const flat: PresenceState = {};
	Object.entries(state).forEach(([user_id, arr]) => {
		if (arr && arr.length > 0) flat[user_id] = arr[0];
	});
	return flat;
}

export function getSelectionLocks(): Record<string, string> {
	const locks: Record<string, string> = {};
	const users = flattenChannelPresenceState();
	Object.entries(users).forEach(([userId, meta]) => {
		if (!meta.selection) return;
		if (!locks[meta.selection]) {
			locks[meta.selection] = userId;
		}
	});
	return locks;
}

export function getElementLockOwner(elementId: string): string | null {
	const locks = getSelectionLocks();
	return locks[elementId] ?? null;
}

export function acquireSelectionLock(userId: string, elementId: string | null): SelectionLockResult {
	if (!presenceChannel) {
		return { ok: true };
	}

	if (!elementId) {
		updatePresence({ selection: null });
		broadcastSelection(userId, null);
		return { ok: true };
	}

	const owner = getElementLockOwner(elementId);
	if (owner && owner !== userId) {
		return { ok: false, lockedBy: owner };
	}

	updatePresence({ selection: elementId });
	broadcastSelection(userId, elementId);
	return { ok: true };
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
	cameraSyncListeners = [];
	selectionListeners = [];
	typingListeners = [];
	viewportListeners = [];

	presenceChannel = supabase.channel(`room:${workspaceId}`, {
		config: {
			broadcast: { ack: false, self: false },
			presence: { key: meta.user_id }
		}
	});

	// Listen for presence sync events
	presenceChannel.on('presence', { event: 'sync' }, () => {
		events.onSync?.(flattenChannelPresenceState());
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

presenceChannel.on('broadcast', { event: 'camera-sync' }, ({ payload }: { payload: CameraSyncBroadcastPayload }) => {
	cameraSyncListeners.forEach((fn) => fn(payload));
});

presenceChannel.on('broadcast', { event: 'element-click' }, ({ payload }: { payload: ElementClickBroadcast }) => {
  elementClickListeners.forEach((fn) => fn(payload));
});

presenceChannel!.on('broadcast', { event: 'selection' }, ({ payload }: { payload: SelectionBroadcastPayload }) => {
  selectionListeners.forEach((fn) => fn(payload));
});

presenceChannel!.on('broadcast', { event: 'typing-status' }, ({ payload }: { payload: TypingStatusBroadcastPayload }) => {
  typingListeners.forEach((fn) => fn(payload));
});

presenceChannel!.on('broadcast', { event: 'viewport' }, ({ payload }: { payload: { user_id: string; zoom: number; panX: number; panY: number } }) => {
  viewportListeners.forEach((fn) => fn(payload));
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

export const broadcastCameraSync = throttle((presenterId: string, clientX: number, clientY: number, zoomScale: number) => {
	if (presenceChannel) {
		updatePresence({
			viewport: {
				zoom: zoomScale,
				panX: clientX,
				panY: clientY,
			},
		});

		presenceChannel.send({
			type: 'broadcast',
			event: 'camera-sync',
			payload: { presenterId, clientX, clientY, zoomScale },
		});
	}
}, 16);

export function onCursorBroadcast(listener: CursorListener) {
	cursorListeners.push(listener);
	return () => { cursorListeners = cursorListeners.filter((fn) => fn !== listener); };
}

export function onCameraSyncBroadcast(listener: CameraSyncListener) {
	cameraSyncListeners.push(listener);
	return () => { cameraSyncListeners = cameraSyncListeners.filter((fn) => fn !== listener); };
}

// New broadcast functions for collaboration metadata
export const broadcastSelection = throttle((user_id: string, element_id: string | null) => {
  if (presenceChannel) {
    presenceChannel.send({
      type: 'broadcast',
      event: 'selection',
      payload: { user_id, element_id },
    });
  }
}, 50);

export function broadcastTyping(userId: string, isTyping: boolean) {
	if (presenceChannel) {
		presenceChannel.send({
			type: 'broadcast',
			event: 'typing-status',
			payload: { userId, isTyping },
		});
	}
}

export const broadcastViewport = throttle((user_id: string, zoom: number, panX: number, panY: number) => {
  if (presenceChannel) {
    presenceChannel.send({
      type: 'broadcast',
      event: 'viewport',
      payload: { user_id, zoom, panX, panY },
    });
  }
}, 100);

// Listener arrays
type SelectionListener = (payload: SelectionBroadcastPayload) => void;
let selectionListeners: SelectionListener[] = [];
export function onSelectionBroadcast(listener: SelectionListener) {
  selectionListeners.push(listener);
  return () => { selectionListeners = selectionListeners.filter((fn) => fn !== listener); };
}

type TypingListener = (payload: TypingStatusBroadcastPayload) => void;
let typingListeners: TypingListener[] = [];
export function onTypingBroadcast(listener: TypingListener) {
  typingListeners.push(listener);
  return () => { typingListeners = typingListeners.filter((fn) => fn !== listener); };
}

type ViewportListener = (payload: { user_id: string; zoom: number; panX: number; panY: number }) => void;
let viewportListeners: ViewportListener[] = [];
export function onViewportBroadcast(listener: ViewportListener) {
  viewportListeners.push(listener);
  return () => { viewportListeners = viewportListeners.filter((fn) => fn !== listener); };
}



export function onElementClickBroadcast(listener: ElementClickListener) {
	elementClickListeners.push(listener);
	return () => { elementClickListeners = elementClickListeners.filter((fn) => fn !== listener); };
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
	cameraSyncListeners = [];
	elementClickListeners = [];
	selectionListeners = [];
	typingListeners = [];
	viewportListeners = [];
}

// Ensure cleanup on tab close or reload
if (typeof window !== 'undefined') {
	window.addEventListener('beforeunload', () => {
		leavePresenceChannel();
	});
}

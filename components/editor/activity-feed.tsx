"use client";

import { useWorkspaceStoreFactory, type ActivityEntry } from "@/store/workspaceStore";

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

const ACTION_COLOR: Record<ActivityEntry["action"], string> = {
  added: "#22c55e",
  deleted: "#ef4444",
  updated: "#3b82f6",
  moved: "#f59e0b",
};

export function ActivityFeed({ workspaceId }: { workspaceId: string }) {
  const store = useWorkspaceStoreFactory(workspaceId);
  const activityLog = store((s) => s.activityLog);

  if (activityLog.length === 0) {
    return (
      <div className="activity-feed-empty">
        <p className="activity-feed-empty-title">No activity yet</p>
        <p className="activity-feed-empty-sub">Changes you and your team make will appear here.</p>
      </div>
    );
  }

  return (
    <div className="activity-feed">
      {activityLog.map((entry) => (
        <div key={entry.id} className="activity-entry">
          <div
            className="activity-avatar"
            style={{ background: ACTION_COLOR[entry.action] + "22", color: ACTION_COLOR[entry.action] }}
          >
            {entry.userName.slice(0, 1).toUpperCase()}
          </div>
          <div className="activity-content">
            <span className="activity-user">{entry.userName}</span>
            <span className="activity-action"> {entry.action} </span>
            <span className="activity-element">{entry.elementName}</span>
          </div>
          <span className="activity-time">{timeAgo(entry.timestamp)}</span>
        </div>
      ))}
    </div>
  );
}

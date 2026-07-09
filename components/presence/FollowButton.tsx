"use client";

import React from 'react';
import { usePresenceStore } from '@/store/presenceStore';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Follow button — syncs the local canvas viewport to a remote collaborator's viewport.
 * Only renders when at least one other user is present.
 * Click to follow the first remote user; click again to stop following.
 */
export const FollowButton: React.FC = () => {
  const users = usePresenceStore((s) => s.users);
  const localId = usePresenceStore((s) => s.localUserId);
  const followedUserId = usePresenceStore((s) => s.followedUserId);
  const setFollowedUser = usePresenceStore((s) => s.setFollowedUser);

  const remoteUserIds = Object.keys(users).filter((id) => id !== localId);
  const firstRemoteId = remoteUserIds[0] ?? null;

  // Don't render if there's nobody to follow
  if (!firstRemoteId && !followedUserId) return null;

  const isFollowing = !!followedUserId;
  const followedUser = followedUserId ? users[followedUserId] : null;
  const followedName = followedUser?.name || 'collaborator';

  const handleClick = () => {
    if (isFollowing) {
      setFollowedUser(null);
    } else if (firstRemoteId) {
      setFollowedUser(firstRemoteId);
    }
  };

  return (
    <button
      id="follow-user-button"
      onClick={handleClick}
      className={[
        'follow-presence-btn',
        isFollowing ? 'follow-presence-btn--active' : '',
      ].join(' ')}
      title={isFollowing ? `Stop following ${followedName}` : `Follow ${users[firstRemoteId!]?.name || 'collaborator'}`}
      aria-pressed={isFollowing}
      aria-label={isFollowing ? 'Stop following collaborator' : 'Follow collaborator'}
    >
      {isFollowing ? (
        <>
          <EyeOff size={12} />
          <span>Unfollow</span>
        </>
      ) : (
        <>
          <Eye size={12} />
          <span>Follow</span>
        </>
      )}
    </button>
  );
};

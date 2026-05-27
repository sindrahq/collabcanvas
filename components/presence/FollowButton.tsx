import React from 'react';
import { usePresenceStore } from '@/store/presenceStore';

/**
 * Simple button to follow/unfollow the first remote user.
 * When a user is followed, the canvas viewport syncs to that user's viewport.
 * Clicking again unfollows (clears follow state).
 */
export const FollowButton: React.FC = () => {
  const users = usePresenceStore((s) => s.users);
  const localId = usePresenceStore((s) => s.localUserId);
  const followedUserId = usePresenceStore((s) => s.followedUserId);
  const setFollowedUser = usePresenceStore((s) => s.setFollowedUser);

  // Choose the first remote user (excluding local) to follow
  const remoteUserIds = Object.keys(users).filter((id) => id !== localId);
  const firstRemoteId = remoteUserIds[0] ?? null;

  const isFollowing = !!followedUserId;

  const handleClick = () => {
    if (isFollowing) {
      setFollowedUser(null);
    } else if (firstRemoteId) {
      setFollowedUser(firstRemoteId);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="absolute top-2 right-2 px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700 transition"
      title={isFollowing ? 'Unfollow user' : 'Follow a user'}
    >
      {isFollowing ? 'Unfollow' : 'Follow'}
    </button>
  );
};

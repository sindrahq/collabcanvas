import React from "react";

interface RoleBadgeProps {
  role: "owner" | "editor" | "commenter" | "viewer";
}

const roleColors: Record<RoleBadgeProps["role"], string> = {
  owner: "bg-role-owner",
  editor: "bg-role-editor",
  commenter: "bg-role-commenter",
  viewer: "bg-role-viewer",
};

export default function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span className={`inline-block px-2 py-1 text-xs font-medium text-white rounded ${roleColors[role]}`}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
}

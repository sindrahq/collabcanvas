"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Layers, LayoutGrid, MessageSquare, SlidersHorizontal } from "lucide-react";
import { LeftSidebar } from "@/components/editor/left-sidebar";
import { RightSidebar } from "@/components/editor/right-sidebar";
import { Toolbar } from "@/components/editor/toolbar";
import type { WorkspaceComment } from "@/lib/comments";

export type WorkspaceSidebarSection = "layers" | "actions" | "inspector" | "comments";

type WorkspaceSidebarProps = {
  workspaceName: string;
  workspaceId?: string | null;
  comments: WorkspaceComment[];
  commentsLoading?: boolean;
  commentsError?: string | null;
  currentUserId?: string | null;
  canComment?: boolean;
  onAddComment: (message: string, targetElementId: string | null) => Promise<void>;
};

const SECTIONS: Array<{
  id: WorkspaceSidebarSection;
  label: string;
  icon: typeof LayoutGrid;
}> = [
  { id: "layers", label: "Layers", icon: Layers },
  { id: "actions", label: "Add", icon: LayoutGrid },
  { id: "inspector", label: "Inspector", icon: SlidersHorizontal },
  { id: "comments", label: "Comments", icon: MessageSquare },
];

function WorkspaceSidebarSectionButton({
  section,
  expanded,
  active,
  onClick,
}: {
  section: (typeof SECTIONS)[number];
  expanded: boolean;
  active: boolean;
  onClick: (section: WorkspaceSidebarSection) => void;
}) {
  const Icon = section.icon;
  return (
    <button
      type="button"
      className={`workspace-sidebar-button${active ? " active" : ""}`}
      onClick={() => onClick(section.id)}
      aria-pressed={active}
      title={section.label}
    >
      <span className="workspace-sidebar-button-icon">
        <Icon size={18} />
      </span>
      <span className={`workspace-sidebar-button-label${expanded ? " visible" : ""}`}>
        {section.label}
      </span>
    </button>
  );
}

export function WorkspaceSidebar({
  workspaceName,
  workspaceId,
  comments,
  commentsLoading,
  commentsError,
  currentUserId,
  canComment = false,
  onAddComment,
}: WorkspaceSidebarProps) {
  const [hovered, setHovered] = useState(false);
  const [activeSection, setActiveSection] = useState<WorkspaceSidebarSection | null>(null);

  const panelVisible = activeSection !== null;
  const railExpanded = hovered && !panelVisible;
  const expanded = railExpanded || panelVisible;

  function handleSectionClick(section: WorkspaceSidebarSection) {
    setActiveSection((current) => (current === section ? null : section));
    setHovered(true);
  }

  return (
    <aside
      className={`workspace-sidebar${expanded ? " expanded" : " collapsed"}${railExpanded ? " hover-expanded" : ""}${panelVisible ? " panel-open" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="workspace-sidebar-rail">
        {SECTIONS.map((section) => (
          <WorkspaceSidebarSectionButton
            key={section.id}
            section={section}
            expanded={railExpanded}
            active={activeSection === section.id}
            onClick={handleSectionClick}
          />
        ))}
      </div>

      <motion.div
        className="workspace-sidebar-panel"
        initial={false}
        animate={{ opacity: panelVisible ? 1 : 0, x: panelVisible ? 0 : -8, width: panelVisible ? 324 : 0 }}
        transition={{ duration: 0.22 }}
        aria-hidden={!panelVisible}
      >
        <div className="workspace-sidebar-panel-header">
          <button
            type="button"
            className="workspace-sidebar-panel-close"
            onClick={() => setActiveSection(null)}
            aria-label="Close sidebar panel"
          >
            ×
          </button>
        </div>

        <div className="workspace-sidebar-panel-body">
          {activeSection === "layers" ? <LeftSidebar /> : null}
          {activeSection === "actions" ? (
            <Toolbar
              workspaceName={workspaceName}
              layout="vertical"
              showSelectionActions={false}
            />
          ) : null}
          {activeSection === "inspector" ? (
            <RightSidebar
              workspaceId={workspaceId}
              comments={comments}
              commentsLoading={commentsLoading}
              commentsError={commentsError}
              currentUserId={currentUserId}
              canComment={canComment}
              onAddComment={onAddComment}
              mode="inspector"
            />
          ) : null}
          {activeSection === "comments" ? (
            <RightSidebar
              workspaceId={workspaceId}
              comments={comments}
              commentsLoading={commentsLoading}
              commentsError={commentsError}
              currentUserId={currentUserId}
              canComment={canComment}
              onAddComment={onAddComment}
              mode="comments"
            />
          ) : null}
        </div>
      </motion.div>
    </aside>
  );
}

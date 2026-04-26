"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Layers, LayoutGrid, MessageSquare, SlidersHorizontal } from "lucide-react";
import { LeftSidebar } from "@/components/editor/left-sidebar";
import { RightSidebar } from "@/components/editor/right-sidebar";
import { Toolbar } from "@/components/editor/toolbar";
import { GlassTooltip } from "@/components/ui/glass-tooltip";
import { TemplatePanel } from "@/components/editor/template-panel";
import type { WorkspaceComment } from "@/lib/comments";

export type WorkspaceSidebarSection = "layers" | "actions" | "inspector" | "comments" | "templates";

type WorkspaceSidebarProps = {
  workspaceName: string;
  workspaceId?: string | null;
  comments: WorkspaceComment[];
  commentsLoading?: boolean;
  commentsError?: string | null;
  currentUserId?: string | null;
  canComment?: boolean;
  onAddComment: (message: string, targetElementId: string | null) => Promise<void>;
  activeSection: WorkspaceSidebarSection | null;
  setActiveSection: (section: WorkspaceSidebarSection | null) => void;
};

export function WorkspaceSidebar({
  workspaceName,
  workspaceId,
  comments,
  commentsLoading,
  commentsError,
  currentUserId,
  canComment = false,
  onAddComment,
  activeSection,
  setActiveSection,
}: WorkspaceSidebarProps) {
  const panelVisible = activeSection !== null;

  return (
    <aside
      className={`workspace-sidebar${panelVisible ? " panel-open" : " collapsed"}`}
    >
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
          {activeSection === "templates" ? <TemplatePanel /> : null}
        </div>
      </motion.div>
    </aside>
  );
}

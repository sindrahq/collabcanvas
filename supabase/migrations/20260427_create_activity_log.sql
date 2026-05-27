-- Migration: Create activity_log table for real-time activity feed
CREATE TABLE IF NOT EXISTS activity_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name text NOT NULL,
    action text NOT NULL,
    element_name text NOT NULL,
    element_type text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc', now())
);

-- Index for efficient workspace queries
CREATE INDEX IF NOT EXISTS idx_activity_log_workspace_id ON activity_log(workspace_id);


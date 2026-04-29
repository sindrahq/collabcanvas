-- Migration: Create canvas_elements table for video and design elements
CREATE TABLE IF NOT EXISTS canvas_elements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    type text NOT NULL,
    position jsonb NOT NULL,
    rotation float,
    text_content text,
    style jsonb NOT NULL,
    style_ext jsonb,
    layer_order int NOT NULL,
    visible boolean DEFAULT true,
    locked boolean DEFAULT false,
    video_url text,
    trim_start float,
    trim_end float,
    created_at timestamp with time zone DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_canvas_elements_workspace_id ON canvas_elements(workspace_id);
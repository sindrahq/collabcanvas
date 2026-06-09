CREATE TABLE IF NOT EXISTS canvas_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'editor', 'commenter', 'viewer')),
  created_at timestamp DEFAULT now(),
  UNIQUE (canvas_id, user_id)
);

CREATE TABLE IF NOT EXISTS canvas_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_canvas_roles_canvas_id ON canvas_roles(canvas_id);
CREATE INDEX IF NOT EXISTS idx_canvas_roles_user_id ON canvas_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_canvas_templates_owner_id ON canvas_templates(owner_id);

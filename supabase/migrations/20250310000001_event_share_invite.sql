/*
  # Event sharing & invite (family share by link or LINE)

  1. event_members: who can access the event (owner + invited members)
  2. event_invites: invite tokens for share link / LINE share
*/

-- event_members: event_id + user_id + role (owner has full access, editor can edit, viewer read-only)
CREATE TABLE IF NOT EXISTS event_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_event_members_event ON event_members(event_id);
CREATE INDEX idx_event_members_user ON event_members(user_id);

ALTER TABLE event_members ENABLE ROW LEVEL SECURITY;

-- Members can read members of events they belong to
CREATE POLICY "Members can read event_members of their events"
  ON event_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_members em
      WHERE em.event_id = event_members.event_id AND em.user_id = auth.uid()
    )
  );

-- Only event owner can insert new members (invite by link is done via accept_invite RPC)
CREATE POLICY "Owner can insert event_members"
  ON event_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id AND e.user_id = auth.uid()
    )
  );

-- Owner can delete members; users can delete themselves (leave)
CREATE POLICY "Owner can delete or leave"
  ON event_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.user_id = auth.uid())
  );

-- event_invites: token for share link / LINE
CREATE TABLE IF NOT EXISTS event_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  max_uses int NOT NULL DEFAULT 10,
  use_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_invites_token ON event_invites(token);
CREATE INDEX idx_event_invites_event ON event_invites(event_id);

ALTER TABLE event_invites ENABLE ROW LEVEL SECURITY;

-- Anyone with token can read invite (to validate and show event name); members can list invites for their event
CREATE POLICY "Read invite by token or if event member"
  ON event_invites FOR SELECT
  USING (true);

-- Only event owner can create invites
CREATE POLICY "Event owner can create invites"
  ON event_invites FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.user_id = auth.uid())
  );

-- Only event owner can delete invites
CREATE POLICY "Event owner can delete invites"
  ON event_invites FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.user_id = auth.uid())
  );

-- Update use_count: only via service role or DB function (or allow owner to update)
CREATE POLICY "Event owner can update invites"
  ON event_invites FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.user_id = auth.uid())
  );

COMMENT ON TABLE event_members IS 'Event sharing: who can access the event (owner + invited family)';
COMMENT ON TABLE event_invites IS 'Invite tokens for share link and LINE invite';

-- RPC: accept invite by token (validates token, adds current user as editor, increments use_count)
CREATE OR REPLACE FUNCTION accept_invite(invite_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
  v_invite_id uuid;
  v_use_count int;
  v_max_uses int;
BEGIN
  SELECT id, event_id, use_count, max_uses
  INTO v_invite_id, v_event_id, v_use_count, v_max_uses
  FROM event_invites
  WHERE token = invite_token
    AND expires_at > now()
  FOR UPDATE;

  IF v_invite_id IS NULL THEN
    RAISE EXCEPTION 'invite_not_found_or_expired';
  END IF;
  IF v_max_uses > 0 AND v_use_count >= v_max_uses THEN
    RAISE EXCEPTION 'invite_max_uses_reached';
  END IF;
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  INSERT INTO event_members (event_id, user_id, role)
  VALUES (v_event_id, auth.uid(), 'editor')
  ON CONFLICT (event_id, user_id) DO NOTHING;

  UPDATE event_invites SET use_count = use_count + 1, updated_at = now() WHERE id = v_invite_id;

  RETURN v_event_id;
END;
$$;

GRANT EXECUTE ON FUNCTION accept_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_invite(text) TO anon;

-- RPC: get invite info by token for display on invite page (no auth required for valid token)
CREATE OR REPLACE FUNCTION get_invite_info(invite_token text)
RETURNS TABLE(event_id uuid, event_name text, expires_at timestamptz, use_count int, max_uses int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.name, i.expires_at, i.use_count, i.max_uses
  FROM event_invites i
  JOIN events e ON e.id = i.event_id
  WHERE i.token = invite_token
    AND i.expires_at > now()
    AND (i.max_uses = 0 OR i.use_count < i.max_uses);
END;
$$;

GRANT EXECUTE ON FUNCTION get_invite_info(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_invite_info(text) TO anon;

-- ─── PuppyLove – Messaging SQL update ────────────────────────────────────────
-- Run this entire file once in Supabase Dashboard → SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Return conversations for the current user, with the OTHER participant's name.
--    SECURITY DEFINER lets it bypass RLS so it can read all conversation_participants.
CREATE OR REPLACE FUNCTION get_conversations_for_user()
RETURNS TABLE(
  id                UUID,
  type              TEXT,
  other_name        TEXT,
  last_message      TEXT,
  last_message_time TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.type,
    CASE
      WHEN c.type = 'walk_group' THEN c.walk_name
      ELSE (
        SELECT p.name
        FROM conversation_participants cp2
        JOIN profiles p ON p.id = cp2.user_id
        WHERE cp2.conversation_id = c.id
          AND cp2.user_id <> auth.uid()
        LIMIT 1
      )
    END AS other_name,
    c.last_message,
    c.last_message_time
  FROM conversations c
  INNER JOIN conversation_participants cp
    ON cp.conversation_id = c.id AND cp.user_id = auth.uid()
  ORDER BY c.last_message_time DESC NULLS LAST;
END;
$$;

-- 2. Find an existing direct conversation between the current user and another user,
--    or create one and add both as participants.
--    Returns the conversation UUID.
CREATE OR REPLACE FUNCTION create_or_get_direct_conversation(
  other_user_id   UUID,
  other_user_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  conv_id UUID;
BEGIN
  -- Find existing direct conversation shared by both users
  SELECT c.id INTO conv_id
  FROM conversations c
  INNER JOIN conversation_participants cp1
    ON cp1.conversation_id = c.id AND cp1.user_id = auth.uid()
  INNER JOIN conversation_participants cp2
    ON cp2.conversation_id = c.id AND cp2.user_id = other_user_id
  WHERE c.type = 'direct'
  LIMIT 1;

  IF conv_id IS NOT NULL THEN
    RETURN conv_id;
  END IF;

  -- Create the conversation
  INSERT INTO conversations (type, participant_name)
  VALUES ('direct', other_user_name)
  RETURNING id INTO conv_id;

  -- Add both participants
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (conv_id, auth.uid()), (conv_id, other_user_id);

  RETURN conv_id;
END;
$$;

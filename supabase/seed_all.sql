-- ═══════════════════════════════════════════════════════════════════════════════
-- PuppyLove – Run this file ONCE in:
--   Supabase Dashboard → SQL Editor → New query → paste → Run
--
-- What it does:
--   1. Creates the messaging RPC functions (safe to re-run – uses CREATE OR REPLACE)
--   2. Creates two test accounts: emma@puppylove.test and james@puppylove.test
--      (password: Test1234! — both are pre-confirmed so they can sign in immediately)
--   3. Creates 2 walks per test user (4 walks total)
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─── Part 1 · Messaging functions ────────────────────────────────────────────

-- Returns conversations for the calling user, with the OTHER person's name resolved.
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

-- Finds an existing direct conversation between the caller and another user,
-- or creates one with both participants added.  Returns the conversation UUID.
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

  INSERT INTO conversations (type, participant_name)
  VALUES ('direct', other_user_name)
  RETURNING id INTO conv_id;

  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (conv_id, auth.uid()), (conv_id, other_user_id);

  RETURN conv_id;
END;
$$;


-- ─── Part 2 · Test accounts & walks ──────────────────────────────────────────

DO $$
DECLARE
  u1 UUID := gen_random_uuid();   -- Emma Thompson
  u2 UUID := gen_random_uuid();   -- James Wilson
  w1 UUID := gen_random_uuid();
  w2 UUID := gen_random_uuid();
  w3 UUID := gen_random_uuid();
  w4 UUID := gen_random_uuid();
BEGIN

  -- ── Emma Thompson ─────────────────────────────────────────────────────────
  INSERT INTO auth.users (
    instance_id, id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    u1,
    'authenticated', 'authenticated',
    'emma@puppylove.test',
    crypt('Test1234!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Emma Thompson"}'::jsonb,
    NOW(), NOW(), false
  );
  -- The handle_new_user trigger creates the profile; make sure the name is right.
  UPDATE profiles SET name = 'Emma Thompson' WHERE id = u1;

  -- ── James Wilson ──────────────────────────────────────────────────────────
  INSERT INTO auth.users (
    instance_id, id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    u2,
    'authenticated', 'authenticated',
    'james@puppylove.test',
    crypt('Test1234!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"James Wilson"}'::jsonb,
    NOW(), NOW(), false
  );
  UPDATE profiles SET name = 'James Wilson' WHERE id = u2;

  -- ── Emma's 2 walks ────────────────────────────────────────────────────────
  INSERT INTO walks (
    id, organizer_id, organizer_name, title, location,
    walk_date, walk_time, duration, description,
    dog_friendly_for, attendee_count, status, max_attendees
  ) VALUES
    (w1, u1, 'Emma Thompson',
     'Morning Hyde Park Stroll', 'Hyde Park, London',
     '2026-07-05', '8:00 AM', 60,
     'A relaxed morning walk along the Serpentine. All friendly dogs welcome — bring treats!',
     ARRAY['all_sizes'], 0, 'active', 15),

    (w2, u1, 'Emma Thompson',
     'Primrose Hill Weekend Walk', 'Primrose Hill, London',
     '2026-07-12', '10:00 AM', 90,
     'Climb Primrose Hill for panoramic London views. Great for dogs who love open spaces and a good sniff.',
     ARRAY['small_only', 'medium_only'], 0, 'active', 10);

  -- ── James's 2 walks ───────────────────────────────────────────────────────
  INSERT INTO walks (
    id, organizer_id, organizer_name, title, location,
    walk_date, walk_time, duration, description,
    dog_friendly_for, attendee_count, status, max_attendees
  ) VALUES
    (w3, u2, 'James Wilson',
     'Evening Regent''s Park Loop', 'Regent''s Park, London',
     '2026-07-06', '6:30 PM', 45,
     'Relaxed evening stroll around the inner circle. Perfect for energetic large dogs.',
     ARRAY['large_only'], 0, 'active', 8),

    (w4, u2, 'James Wilson',
     'Hampstead Heath Adventure', 'Hampstead Heath, London',
     '2026-07-13', '9:00 AM', 120,
     'Explore the ponds and woodland of Hampstead Heath. Bring plenty of water for your pup!',
     ARRAY['all_sizes'], 0, 'active', 20);

  -- ── Organiser RSVPs — sync_attendee_count trigger sets count to 1 each ────
  INSERT INTO rsvps (walk_id, user_id, status) VALUES
    (w1, u1, 'going'),
    (w2, u1, 'going'),
    (w3, u2, 'going'),
    (w4, u2, 'going');

END;
$$;

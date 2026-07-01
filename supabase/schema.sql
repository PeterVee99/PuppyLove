-- ─── PuppyLove Database Schema ───────────────────────────────────────────────
-- Run this entire file in the Supabase SQL Editor:
--   Dashboard → SQL Editor → New query → paste → Run
-- Then create storage buckets in Storage → New bucket:
--   "avatars"  (public), "dogs" (public), "walks" (public)
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Profiles ─────────────────────────────────────────────────────────────────
-- Mirrors auth.users; created automatically by trigger on signup.
CREATE TABLE IF NOT EXISTS profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL DEFAULT 'Dog Walker',
  location          TEXT NOT NULL DEFAULT '',
  bio               TEXT NOT NULL DEFAULT '',
  profile_image_url TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ─── Dogs ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dogs (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  breed     TEXT NOT NULL DEFAULT '',
  size      TEXT NOT NULL DEFAULT 'medium' CHECK (size IN ('small', 'medium', 'large')),
  age       INTEGER CHECK (age >= 0 AND age <= 30),
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dogs_select_own" ON dogs
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY "dogs_insert_own" ON dogs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "dogs_update_own" ON dogs
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "dogs_delete_own" ON dogs
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- ─── Walks ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS walks (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organizer_name    TEXT NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  location          TEXT NOT NULL,
  walk_date         DATE NOT NULL,
  walk_time         TEXT NOT NULL,
  duration          INTEGER NOT NULL DEFAULT 60 CHECK (duration > 0),
  distance          NUMERIC(5,1),
  max_attendees     INTEGER CHECK (max_attendees > 0),
  attendee_count    INTEGER NOT NULL DEFAULT 1 CHECK (attendee_count >= 0),
  dog_friendly_for  TEXT[] NOT NULL DEFAULT ARRAY['all_sizes'],
  image_url         TEXT,
  recurring         BOOLEAN NOT NULL DEFAULT FALSE,
  recurring_until   DATE,
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE walks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "walks_select_active" ON walks
  FOR SELECT TO authenticated USING (status = 'active');

CREATE POLICY "walks_insert_own" ON walks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "walks_update_own" ON walks
  FOR UPDATE TO authenticated USING (auth.uid() = organizer_id) WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "walks_delete_own" ON walks
  FOR DELETE TO authenticated USING (auth.uid() = organizer_id);

-- ─── RSVPs ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rsvps (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  walk_id    UUID NOT NULL REFERENCES walks(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'interested', 'not_going')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(walk_id, user_id)
);

ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see all RSVPs (needed for attendee counts on walk cards)
CREATE POLICY "rsvps_select" ON rsvps
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "rsvps_insert_own" ON rsvps
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rsvps_delete_own" ON rsvps
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ─── Conversations ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type               TEXT NOT NULL CHECK (type IN ('direct', 'walk_group')),
  walk_id            UUID REFERENCES walks(id) ON DELETE CASCADE,
  walk_name          TEXT,
  participant_name   TEXT,
  participant_count  INTEGER DEFAULT 2,
  last_message       TEXT DEFAULT '',
  last_message_time  TIMESTAMPTZ DEFAULT NOW(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, user_id)
);

ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- Users can only see conversations they participate in
CREATE POLICY "conv_select" ON conversations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "conv_participants_select" ON conversation_participants
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "conv_participants_insert" ON conversation_participants
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ─── Messages ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text            TEXT NOT NULL CHECK (length(text) > 0 AND length(text) <= 2000),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select" ON messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "messages_insert" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    )
  );

-- ─── Triggers ─────────────────────────────────────────────────────────────────

-- Auto-create profile when user signs up.
-- SECURITY DEFINER is required here because the trigger must write to profiles
-- on behalf of the new user before their session is established.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Dog Walker')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Keep attendee_count in sync when RSVPs are inserted/deleted.
-- SECURITY DEFINER is required because an RSVP-inserting user does not have
-- UPDATE permission on walks rows they don't own.
CREATE OR REPLACE FUNCTION sync_attendee_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE walks SET attendee_count = attendee_count + 1 WHERE id = NEW.walk_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE walks SET attendee_count = GREATEST(0, attendee_count - 1) WHERE id = OLD.walk_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER rsvp_count_trigger
  AFTER INSERT OR DELETE ON rsvps
  FOR EACH ROW EXECUTE FUNCTION sync_attendee_count();

-- Update last_message on conversations when a message is sent.
CREATE OR REPLACE FUNCTION sync_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE conversations
  SET last_message = NEW.text, last_message_time = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER message_last_trigger
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION sync_last_message();

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS walks_organizer_idx   ON walks(organizer_id);
CREATE INDEX IF NOT EXISTS walks_date_idx        ON walks(walk_date);
CREATE INDEX IF NOT EXISTS walks_status_idx      ON walks(status);
CREATE INDEX IF NOT EXISTS rsvps_walk_idx        ON rsvps(walk_id);
CREATE INDEX IF NOT EXISTS rsvps_user_idx        ON rsvps(user_id);
CREATE INDEX IF NOT EXISTS dogs_owner_idx        ON dogs(owner_id);
CREATE INDEX IF NOT EXISTS messages_conv_idx     ON messages(conversation_id, created_at);

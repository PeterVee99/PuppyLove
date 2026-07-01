-- Recalculate attendee_count for all walks from actual RSVPs
-- Run once in: Supabase Dashboard → SQL Editor → New query → Run

UPDATE walks w
SET attendee_count = (
  SELECT COUNT(*) FROM rsvps r
  WHERE r.walk_id = w.id AND r.status = 'going'
);

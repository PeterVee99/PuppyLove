-- ═══════════════════════════════════════════════════════════════════════════════
-- PuppyLove – Users 3 & 4 with 5 walks each + images
-- Run once in: Supabase Dashboard → SQL Editor → New query → Run
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  u3  UUID := gen_random_uuid();   -- Sophie Chen
  u4  UUID := gen_random_uuid();   -- Marcus Williams

  -- Sophie's walks
  s1  UUID := gen_random_uuid();
  s2  UUID := gen_random_uuid();
  s3  UUID := gen_random_uuid();
  s4  UUID := gen_random_uuid();
  s5  UUID := gen_random_uuid();

  -- Marcus's walks
  m1  UUID := gen_random_uuid();
  m2  UUID := gen_random_uuid();
  m3  UUID := gen_random_uuid();
  m4  UUID := gen_random_uuid();
  m5  UUID := gen_random_uuid();

BEGIN

  -- ────────────────────────────────────────────────────────────────────────────
  -- User 3 · Sophie Chen
  -- ────────────────────────────────────────────────────────────────────────────
  INSERT INTO auth.users (
    instance_id, id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    u3, 'authenticated', 'authenticated',
    'sophie@puppylove.test',
    crypt('Test1234!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Sophie Chen"}'::jsonb,
    NOW(), NOW(), false
  );

  UPDATE profiles SET
    name              = 'Sophie Chen',
    location          = 'East London',
    bio               = 'Golden Retriever mum 🐾 and early-morning runner. Always hunting down the best dog-friendly green spaces in the city!',
    profile_image_url = 'https://i.pravatar.cc/300?img=16'
  WHERE id = u3;

  -- ────────────────────────────────────────────────────────────────────────────
  -- User 4 · Marcus Williams
  -- ────────────────────────────────────────────────────────────────────────────
  INSERT INTO auth.users (
    instance_id, id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    u4, 'authenticated', 'authenticated',
    'marcus@puppylove.test',
    crypt('Test1234!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Marcus Williams"}'::jsonb,
    NOW(), NOW(), false
  );

  UPDATE profiles SET
    name              = 'Marcus Williams',
    location          = 'North London',
    bio               = 'Professional dog trainer with 8 years experience and founder of the Bark & Stride walking club. Specialising in socialisation walks for large breeds.',
    profile_image_url = 'https://i.pravatar.cc/300?img=52'
  WHERE id = u4;

  -- ────────────────────────────────────────────────────────────────────────────
  -- Sophie's 5 walks
  -- ────────────────────────────────────────────────────────────────────────────
  INSERT INTO walks (
    id, organizer_id, organizer_name,
    title, location, walk_date, walk_time, duration, distance,
    description, dog_friendly_for, image_url,
    recurring, recurring_until, attendee_count, status, max_attendees
  ) VALUES

    (s1, u3, 'Sophie Chen',
     'Sunrise Battersea Park Walk',
     'Battersea Park, London',
     '2026-07-07', '6:30 AM', 60, 3.5,
     'Beat the crowds with an early morning walk along the Thames-side path through Battersea Park. Stunning sunrise views — dogs love the open meadows!',
     ARRAY['all_sizes'],
     'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=450&fit=crop',
     false, null, 0, 'active', 12),

    (s2, u3, 'Sophie Chen',
     'Victoria Park Dog Social',
     'Victoria Park, East London',
     '2026-07-14', '9:00 AM', 90, 4.2,
     'Victoria Park has one of the best off-lead areas in East London. Come for a sociable morning with your dog — there''s a dog-friendly café stop halfway round!',
     ARRAY['small_only', 'medium_only'],
     'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=450&fit=crop',
     false, null, 0, 'active', 15),

    (s3, u3, 'Sophie Chen',
     'Clapham Common Weekly Run',
     'Clapham Common, London',
     '2026-07-08', '7:30 AM', 45, 3.0,
     'Join our friendly weekly jogging group on Clapham Common. Dogs run alongside owners — bring a lead for the busier sections. All fitness levels welcome!',
     ARRAY['all_sizes'],
     'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=800&h=450&fit=crop',
     true, '2026-09-30', 0, 'active', 10),

    (s4, u3, 'Sophie Chen',
     'Richmond Park Deer Safari',
     'Richmond Park, London',
     '2026-07-19', '10:00 AM', 120, 7.0,
     'A longer walk through the royal deer park. Dogs must be kept on leads near deer enclosures but can go off-lead in the designated areas. Bring water — it''s a big one!',
     ARRAY['large_only'],
     'https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?w=800&h=450&fit=crop',
     false, null, 0, 'active', 8),

    (s5, u3, 'Sophie Chen',
     'Chelsea Embankment Evening Stroll',
     'Chelsea Embankment, London',
     '2026-07-21', '6:00 PM', 60, 4.0,
     'A scenic evening walk along the Thames from Chelsea Bridge to Albert Bridge and back. Perfect for winding down after work with your pup watching the boats go by.',
     ARRAY['all_sizes'],
     'https://images.unsplash.com/photo-1534361960057-19f4434a4f97?w=800&h=450&fit=crop',
     false, null, 0, 'active', 20);

  -- ────────────────────────────────────────────────────────────────────────────
  -- Marcus's 5 walks
  -- ────────────────────────────────────────────────────────────────────────────
  INSERT INTO walks (
    id, organizer_id, organizer_name,
    title, location, walk_date, walk_time, duration, distance,
    description, dog_friendly_for, image_url,
    recurring, recurring_until, attendee_count, status, max_attendees
  ) VALUES

    (m1, u4, 'Marcus Williams',
     'Epping Forest Weekend Hike',
     'Epping Forest, Essex',
     '2026-07-11', '9:00 AM', 180, 10.0,
     'A proper off-lead adventure through ancient woodland. Marcus will lead the group on the lesser-known trails away from the tourist paths. Bring food, water, and a muddy towel!',
     ARRAY['all_sizes'],
     'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&h=450&fit=crop',
     false, null, 0, 'active', 10),

    (m2, u4, 'Marcus Williams',
     'Regent''s Canal Towpath Walk',
     'Regent''s Canal, London',
     '2026-07-15', '11:00 AM', 75, 5.5,
     'Walk the famous towpath from Little Venice to Broadway Market. Loads of ducks to watch (and resist chasing!). We finish at a dog-friendly pub for lunch.',
     ARRAY['all_sizes'],
     'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?w=800&h=450&fit=crop',
     false, null, 0, 'active', 16),

    (m3, u4, 'Marcus Williams',
     'Alexandra Palace Sunrise Walk',
     'Alexandra Palace, North London',
     '2026-07-08', '7:00 AM', 90, 4.5,
     'Watch the sun rise over London from the top of Ally Pally with your dog by your side. Marcus runs this weekly — great for off-lead socialisation on the open hill.',
     ARRAY['all_sizes'],
     'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=450&fit=crop',
     true, '2026-10-31', 0, 'active', 12),

    (m4, u4, 'Marcus Williams',
     'Walthamstow Wetlands Nature Walk',
     'Walthamstow Wetlands, London',
     '2026-07-22', '10:30 AM', 60, 3.0,
     'Europe''s largest urban wetland reserve. Dogs on leads throughout but incredible birdwatching and waterside scenery. Perfect for calmer dogs who enjoy a steady pace.',
     ARRAY['small_only', 'medium_only'],
     'https://images.unsplash.com/photo-1560743641-3914f2c45636?w=800&h=450&fit=crop',
     false, null, 0, 'active', 8),

    (m5, u4, 'Marcus Williams',
     'Hackney Marshes Evening Sprint',
     'Hackney Marshes, East London',
     '2026-07-25', '5:30 PM', 45, 4.0,
     'Fast-paced evening run across the marshes for energetic large breeds. Marcus will include some off-lead recall and agility exercises. Great for high-energy dogs that need a proper run-out!',
     ARRAY['large_only'],
     'https://images.unsplash.com/photo-1511797760253-c3e5a196f6a1?w=800&h=450&fit=crop',
     false, null, 0, 'active', 6);

  -- ────────────────────────────────────────────────────────────────────────────
  -- Organiser RSVPs — trigger sets attendee_count 0 → 1 for each walk
  -- ────────────────────────────────────────────────────────────────────────────
  INSERT INTO rsvps (walk_id, user_id, status) VALUES
    (s1, u3, 'going'),
    (s2, u3, 'going'),
    (s3, u3, 'going'),
    (s4, u3, 'going'),
    (s5, u3, 'going'),
    (m1, u4, 'going'),
    (m2, u4, 'going'),
    (m3, u4, 'going'),
    (m4, u4, 'going'),
    (m5, u4, 'going');

END;
$$;

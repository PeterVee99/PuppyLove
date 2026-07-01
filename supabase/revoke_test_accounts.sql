-- Revoke test account access
-- Run this in Supabase Dashboard → SQL Editor if you want to lock the seed
-- test accounts so they can no longer be used to sign in.
--
-- Test accounts created by seed_all.sql and seed_users_3_4.sql:
--   emma@puppylove.test   / Test1234!
--   james@puppylove.test  / Test1234!
--   sophie@puppylove.test / Test1234!
--   marcus@puppylove.test / Test1234!
--
-- This sets their passwords to a random value they cannot know,
-- effectively locking the accounts without deleting their walk data.

UPDATE auth.users
SET encrypted_password = crypt(gen_random_uuid()::text, gen_salt('bf'))
WHERE email IN (
  'emma@puppylove.test',
  'james@puppylove.test',
  'sophie@puppylove.test',
  'marcus@puppylove.test'
);

-- To permanently delete the test accounts and all their data instead, run:
-- DELETE FROM auth.users WHERE email LIKE '%@puppylove.test';

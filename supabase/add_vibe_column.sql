-- Add vibe column to walks table
-- Run once in: Supabase Dashboard → SQL Editor → New query → Run

ALTER TABLE walks ADD COLUMN IF NOT EXISTS vibe TEXT[] DEFAULT '{}';

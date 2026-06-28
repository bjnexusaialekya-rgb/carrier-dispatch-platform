-- ============================================================
-- Migration 003: Promote specific users to correct roles
-- ============================================================
-- All users default to professional_athlete from the trigger.
-- Run this in Supabase SQL Editor to fix known accounts.
-- ============================================================

-- BJNEXUS AI main admin account
UPDATE public.users
SET role = 'admin'
WHERE email = 'bjnexusai.alekya@gmail.com';

-- Uncomment and adjust as needed:
-- UPDATE public.users SET role = 'admin' WHERE email = 'bjnexus.ai@gmail.com';
-- UPDATE public.users SET role = 'agent' WHERE email = 'bjnexusai.007@gmail.com';

-- Verify
SELECT id, email, full_name, role FROM public.users ORDER BY role, email;
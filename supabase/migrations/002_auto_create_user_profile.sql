-- ============================================================
-- Migration 002: Auto-create public.users profile on signup
-- ============================================================
-- WHY THIS EXISTS:
-- Supabase Auth creates a row in auth.users on signup.
-- Our app's requireAuth() checks public.users — a separate table.
-- Without this trigger, every new signup has a valid session but
-- no profile row → requireAuth() redirects to /login → infinite loop.
--
-- SECURITY DEFINER bypasses RLS — correct here because authenticated
-- role has no INSERT policy on public.users intentionally.
--
-- full_name defaults to email prefix if not in raw_user_meta_data.
-- role defaults to professional_athlete — Google OAuth users always get this.
-- To promote: UPDATE public.users SET role = 'admin' WHERE email = '...';
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'professional_athlete')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill orphaned auth users (safe to re-run)
INSERT INTO public.users (id, email, full_name, role)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', SPLIT_PART(au.email, '@', 1)),
  COALESCE((au.raw_user_meta_data->>'role')::user_role, 'professional_athlete')
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL;
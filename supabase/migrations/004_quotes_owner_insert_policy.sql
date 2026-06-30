-- ============================================================
-- Migration 004: Add missing INSERT policy on public.quotes
-- ============================================================
-- WHY THIS EXISTS:
-- public.quotes had GRANT INSERT at the table level, but no RLS
-- INSERT policy for regular (non-admin) users. The booking flow
-- calls supabase.from("quotes").insert(...) as the logged-in
-- athlete via the anon-key client — RLS silently blocked this
-- insert with no error surfaced to the user, leaving shipments
-- stuck on "Pending" with no quote ever generated.
--
-- This mirrors the existing quotes_owner_select / quotes_owner_update
-- pattern: a user may insert a quote only for a shipment they own.
-- ============================================================

CREATE POLICY "quotes_owner_insert"
  ON public.quotes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shipments s
      WHERE s.id = quotes.shipment_id AND s.user_id = (select auth.uid())
    )
  );

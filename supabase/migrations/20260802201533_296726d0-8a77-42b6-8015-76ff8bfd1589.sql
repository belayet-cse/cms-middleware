-- helper: any staff member with an assigned role
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id);
$$;

-- customers
DROP POLICY IF EXISTS customers_read ON public.customers;
CREATE POLICY customers_read ON public.customers
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- cards
DROP POLICY IF EXISTS cards_read ON public.cards;
CREATE POLICY cards_read ON public.cards
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- card_requests
DROP POLICY IF EXISTS requests_read ON public.card_requests;
CREATE POLICY requests_read ON public.card_requests
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- request_approvals
DROP POLICY IF EXISTS approvals_read ON public.request_approvals;
CREATE POLICY approvals_read ON public.request_approvals
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- fee_profiles
DROP POLICY IF EXISTS fees_read ON public.fee_profiles;
CREATE POLICY fees_read ON public.fee_profiles
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- audit_logs: admin / auditor only
DROP POLICY IF EXISTS audit_logs_read ON public.audit_logs;
CREATE POLICY audit_logs_read ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'auditor'));

-- integration_logs: admin / auditor only
DROP POLICY IF EXISTS integration_logs_read ON public.integration_logs;
CREATE POLICY integration_logs_read ON public.integration_logs
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'auditor'));

-- bulk_batches: uploader, checkers, admins
DROP POLICY IF EXISTS batches_read ON public.bulk_batches;
CREATE POLICY batches_read ON public.bulk_batches
  FOR SELECT TO authenticated
  USING (uploaded_by = auth.uid() OR public.can_check(auth.uid()));

-- profiles: self or admin
DROP POLICY IF EXISTS profiles_select_all ON public.profiles;
CREATE POLICY profiles_select_own_or_admin ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin(auth.uid()));

-- user_roles: self or admin
DROP POLICY IF EXISTS user_roles_select ON public.user_roles;
CREATE POLICY user_roles_select_own_or_admin ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- function execute privileges
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_make(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_check(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.next_card_request_reference() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_make(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_check(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.next_card_request_reference() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO service_role;
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION private.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION private.can_make(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('maker','admin'));
$$;

CREATE OR REPLACE FUNCTION private.can_check(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('checker1','checker2','admin'));
$$;

CREATE OR REPLACE FUNCTION private.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id);
$$;

GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.can_make(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.can_check(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_staff(uuid) TO authenticated, service_role;

-- audit_logs
DROP POLICY IF EXISTS audit_logs_read ON public.audit_logs;
CREATE POLICY audit_logs_read ON public.audit_logs FOR SELECT TO authenticated
  USING (private.is_admin(auth.uid()) OR private.has_role(auth.uid(), 'auditor'));

-- integration_logs
DROP POLICY IF EXISTS integration_logs_read ON public.integration_logs;
CREATE POLICY integration_logs_read ON public.integration_logs FOR SELECT TO authenticated
  USING (private.is_admin(auth.uid()) OR private.has_role(auth.uid(), 'auditor'));

-- bulk_batches
DROP POLICY IF EXISTS batches_read ON public.bulk_batches;
CREATE POLICY batches_read ON public.bulk_batches FOR SELECT TO authenticated
  USING (uploaded_by = auth.uid() OR private.can_check(auth.uid()));
DROP POLICY IF EXISTS batches_insert ON public.bulk_batches;
CREATE POLICY batches_insert ON public.bulk_batches FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid() AND private.can_make(auth.uid()));

-- card_products
DROP POLICY IF EXISTS products_admin_write ON public.card_products;
CREATE POLICY products_admin_write ON public.card_products FOR ALL TO authenticated
  USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

-- fee_profiles
DROP POLICY IF EXISTS fees_admin_write ON public.fee_profiles;
CREATE POLICY fees_admin_write ON public.fee_profiles FOR ALL TO authenticated
  USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
DROP POLICY IF EXISTS fees_read ON public.fee_profiles;
CREATE POLICY fees_read ON public.fee_profiles FOR SELECT TO authenticated
  USING (private.is_staff(auth.uid()));

-- customers
DROP POLICY IF EXISTS customers_read ON public.customers;
CREATE POLICY customers_read ON public.customers FOR SELECT TO authenticated
  USING (private.is_staff(auth.uid()));
DROP POLICY IF EXISTS customers_write ON public.customers;
CREATE POLICY customers_write ON public.customers FOR INSERT TO authenticated
  WITH CHECK (private.can_make(auth.uid()) OR private.can_check(auth.uid()));
DROP POLICY IF EXISTS customers_update ON public.customers;
CREATE POLICY customers_update ON public.customers FOR UPDATE TO authenticated
  USING (private.can_make(auth.uid()) OR private.can_check(auth.uid()));

-- cards
DROP POLICY IF EXISTS cards_read ON public.cards;
CREATE POLICY cards_read ON public.cards FOR SELECT TO authenticated
  USING (private.is_staff(auth.uid()));
DROP POLICY IF EXISTS cards_insert ON public.cards;
CREATE POLICY cards_insert ON public.cards FOR INSERT TO authenticated
  WITH CHECK (private.can_check(auth.uid()));
DROP POLICY IF EXISTS cards_update ON public.cards;
CREATE POLICY cards_update ON public.cards FOR UPDATE TO authenticated
  USING (private.can_check(auth.uid()));

-- card_requests
DROP POLICY IF EXISTS requests_read ON public.card_requests;
CREATE POLICY requests_read ON public.card_requests FOR SELECT TO authenticated
  USING (private.is_staff(auth.uid()));
DROP POLICY IF EXISTS requests_insert ON public.card_requests;
CREATE POLICY requests_insert ON public.card_requests FOR INSERT TO authenticated
  WITH CHECK (private.can_make(auth.uid()) AND maker_id = auth.uid());
DROP POLICY IF EXISTS requests_update ON public.card_requests;
CREATE POLICY requests_update ON public.card_requests FOR UPDATE TO authenticated
  USING ((private.can_make(auth.uid()) AND maker_id = auth.uid() AND status = ANY (ARRAY['draft'::request_status,'returned'::request_status])) OR private.can_check(auth.uid()));
DROP POLICY IF EXISTS requests_delete_draft ON public.card_requests;
CREATE POLICY requests_delete_draft ON public.card_requests FOR DELETE TO authenticated
  USING (private.can_make(auth.uid()) AND maker_id = auth.uid() AND status = 'draft'::request_status);

-- profiles
DROP POLICY IF EXISTS profiles_select_own_or_admin ON public.profiles;
CREATE POLICY profiles_select_own_or_admin ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR private.is_admin(auth.uid()));
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR private.is_admin(auth.uid()));

-- request_approvals
DROP POLICY IF EXISTS approvals_read ON public.request_approvals;
CREATE POLICY approvals_read ON public.request_approvals FOR SELECT TO authenticated
  USING (private.is_staff(auth.uid()));

-- user_roles
DROP POLICY IF EXISTS user_roles_select_own_or_admin ON public.user_roles;
CREATE POLICY user_roles_select_own_or_admin ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.is_admin(auth.uid()));

DROP FUNCTION IF EXISTS public.is_staff(uuid);
DROP FUNCTION IF EXISTS public.can_make(uuid);
DROP FUNCTION IF EXISTS public.can_check(uuid);
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
-- 1. Harden permission-check helper functions
CREATE OR REPLACE FUNCTION private.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$ SELECT _user_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id); $$;

CREATE OR REPLACE FUNCTION private.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$ SELECT _user_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role = 'admin'); $$;

CREATE OR REPLACE FUNCTION private.can_make(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$ SELECT _user_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role IN ('maker','admin')); $$;

CREATE OR REPLACE FUNCTION private.can_check(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$ SELECT _user_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role IN ('checker1','checker2','admin')); $$;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$ SELECT _user_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role = _role); $$;

REVOKE ALL ON FUNCTION private.is_staff(uuid), private.is_admin(uuid), private.can_make(uuid),
  private.can_check(uuid), private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_staff(uuid), private.is_admin(uuid), private.can_make(uuid),
  private.can_check(uuid), private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 2. profiles: admin-controlled create/delete
DROP POLICY IF EXISTS profiles_insert_admin ON public.profiles;
CREATE POLICY profiles_insert_admin ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS profiles_delete_admin ON public.profiles;
CREATE POLICY profiles_delete_admin ON public.profiles
  FOR DELETE TO authenticated
  USING (private.is_admin(auth.uid()) AND id <> auth.uid());

-- 3. user_roles: admin-only role management, no self-escalation
DROP POLICY IF EXISTS user_roles_insert_admin ON public.user_roles;
CREATE POLICY user_roles_insert_admin ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (private.is_admin(auth.uid()) AND user_id <> auth.uid());

DROP POLICY IF EXISTS user_roles_update_admin ON public.user_roles;
CREATE POLICY user_roles_update_admin ON public.user_roles
  FOR UPDATE TO authenticated
  USING (private.is_admin(auth.uid()) AND user_id <> auth.uid())
  WITH CHECK (private.is_admin(auth.uid()) AND user_id <> auth.uid());

DROP POLICY IF EXISTS user_roles_delete_admin ON public.user_roles;
CREATE POLICY user_roles_delete_admin ON public.user_roles
  FOR DELETE TO authenticated
  USING (private.is_admin(auth.uid()) AND user_id <> auth.uid());

GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT INSERT, DELETE ON public.profiles TO authenticated;

-- 4. request_approvals immutability is intentional (append-only audit trail)
COMMENT ON TABLE public.request_approvals IS
  'Append-only maker-checker audit trail. No UPDATE or DELETE policies exist by design; rows are immutable once written.';
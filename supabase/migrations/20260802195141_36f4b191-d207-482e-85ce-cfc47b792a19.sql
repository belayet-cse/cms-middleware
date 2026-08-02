CREATE OR REPLACE FUNCTION public.next_card_request_reference()
RETURNS text LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public AS $$
  SELECT 'CR-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.card_request_seq')::text, 7, '0');
$$;

REVOKE EXECUTE ON FUNCTION public.next_card_request_reference() FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_check(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_make(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.next_card_request_reference() TO authenticated, service_role;
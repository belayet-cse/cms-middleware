-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin','maker','checker1','checker2','auditor');
CREATE TYPE public.card_type AS ENUM ('primary_credit','supplementary_credit','business','prepaid');
CREATE TYPE public.request_type AS ENUM ('new_onboarding','amendment','replacement','renewal','card_delete','contact_delete');
CREATE TYPE public.request_status AS ENUM ('draft','pending_checker','returned','rejected','approved','limit_pending_checker1','limit_pending_checker2','completed');
CREATE TYPE public.card_status AS ENUM ('requested','active','inactive','blocked','hotlisted','closed','expired');
CREATE TYPE public.payment_instruction AS ENUM ('none','fc','erq','rfcd');
CREATE TYPE public.fc_category AS ENUM ('none','private_travel_quota','erq','fc','rfcd','other');
CREATE TYPE public.sync_status AS ENUM ('pending','synced','failed');
CREATE TYPE public.approval_action AS ENUM ('submitted','approved','returned','rejected','limit_set','limit_approved','completed');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  employee_id text,
  designation text,
  branch text,
  email text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.can_check(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('checker1','checker2','admin'));
$$;

CREATE OR REPLACE FUNCTION public.can_make(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('maker','admin'));
$$;

-- new user handling: profile + first user becomes admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE user_count int;
BEGIN
  INSERT INTO public.profiles (id, full_name, email, employee_id, designation, branch)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name',''),
    NEW.email,
    NEW.raw_user_meta_data->>'employee_id',
    NEW.raw_user_meta_data->>'designation',
    NEW.raw_user_meta_data->>'branch'
  );
  SELECT count(*) INTO user_count FROM auth.users;
  IF user_count <= 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated USING (true);

-- CARD PRODUCTS
CREATE TABLE public.card_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code text NOT NULL UNIQUE,
  product_name text NOT NULL,
  card_type public.card_type NOT NULL,
  scheme text NOT NULL DEFAULT 'VISA',
  currency text NOT NULL DEFAULT 'BDT',
  bin text NOT NULL DEFAULT '446789',
  min_limit numeric(18,2) NOT NULL DEFAULT 0,
  max_limit numeric(18,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.card_products TO authenticated;
GRANT ALL ON public.card_products TO service_role;
ALTER TABLE public.card_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_read" ON public.card_products FOR SELECT TO authenticated USING (true);
CREATE POLICY "products_admin_write" ON public.card_products FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER card_products_updated BEFORE UPDATE ON public.card_products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- FEE PROFILES
CREATE TABLE public.fee_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_code text NOT NULL UNIQUE,
  profile_name text NOT NULL,
  annual_fee numeric(18,2) NOT NULL DEFAULT 0,
  late_fee numeric(18,2) NOT NULL DEFAULT 0,
  cash_advance_rate numeric(6,3) NOT NULL DEFAULT 0,
  interest_rate numeric(6,3) NOT NULL DEFAULT 0,
  credit_shield_premium_rate numeric(6,3) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fee_profiles TO authenticated;
GRANT ALL ON public.fee_profiles TO service_role;
ALTER TABLE public.fee_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fees_read" ON public.fee_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "fees_admin_write" ON public.fee_profiles FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER fee_profiles_updated BEFORE UPDATE ON public.fee_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- CUSTOMERS
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cif_number text UNIQUE,
  cms_client_id text UNIQUE,
  full_name text NOT NULL,
  father_name text,
  mother_name text,
  date_of_birth date,
  national_id text,
  passport_no text,
  tin text,
  gender text,
  mobile text NOT NULL,
  email text,
  address_line1 text,
  address_line2 text,
  city text,
  postal_code text,
  country text NOT NULL DEFAULT 'Bangladesh',
  cbs_sync public.sync_status NOT NULL DEFAULT 'pending',
  cms_sync public.sync_status NOT NULL DEFAULT 'pending',
  last_synced_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers_read" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "customers_write" ON public.customers FOR INSERT TO authenticated WITH CHECK (public.can_make(auth.uid()) OR public.can_check(auth.uid()));
CREATE POLICY "customers_update" ON public.customers FOR UPDATE TO authenticated USING (public.can_make(auth.uid()) OR public.can_check(auth.uid()));
CREATE TRIGGER customers_updated BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- CARD REQUESTS
CREATE TABLE public.card_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_no text NOT NULL UNIQUE,
  request_type public.request_type NOT NULL DEFAULT 'new_onboarding',
  card_type public.card_type NOT NULL,
  status public.request_status NOT NULL DEFAULT 'draft',
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  existing_cif text,
  use_existing_cif boolean NOT NULL DEFAULT false,
  applicant_name text NOT NULL,
  embossing_name text,
  father_name text,
  mother_name text,
  date_of_birth date,
  national_id text,
  passport_no text,
  tin text,
  gender text,
  mobile text NOT NULL,
  email text,
  address_line1 text,
  address_line2 text,
  city text,
  postal_code text,
  primary_card_id uuid,
  company_name text,
  product_id uuid REFERENCES public.card_products(id),
  fee_profile_id uuid REFERENCES public.fee_profiles(id),
  requested_limit numeric(18,2) NOT NULL DEFAULT 0,
  approved_limit numeric(18,2),
  payment_instruction public.payment_instruction NOT NULL DEFAULT 'none',
  fc_account_no text,
  fc_category public.fc_category NOT NULL DEFAULT 'none',
  credit_shield boolean NOT NULL DEFAULT false,
  credit_shield_rate numeric(6,3),
  email_tagged boolean NOT NULL DEFAULT false,
  sms_tagged boolean NOT NULL DEFAULT false,
  generated_card_number text,
  generated_client_id text,
  generated_cif text,
  maker_id uuid REFERENCES auth.users(id),
  maker_remarks text,
  submitted_at timestamptz,
  checker_id uuid REFERENCES auth.users(id),
  checker_remarks text,
  checked_at timestamptz,
  limit_checker1_id uuid REFERENCES auth.users(id),
  limit_checker1_at timestamptz,
  limit_checker2_id uuid REFERENCES auth.users(id),
  limit_checker2_at timestamptz,
  bulk_batch_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX card_requests_status_idx ON public.card_requests(status);
CREATE INDEX card_requests_maker_idx ON public.card_requests(maker_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.card_requests TO authenticated;
GRANT ALL ON public.card_requests TO service_role;
ALTER TABLE public.card_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "requests_read" ON public.card_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "requests_insert" ON public.card_requests FOR INSERT TO authenticated WITH CHECK (public.can_make(auth.uid()) AND maker_id = auth.uid());
CREATE POLICY "requests_update" ON public.card_requests FOR UPDATE TO authenticated
  USING ((public.can_make(auth.uid()) AND maker_id = auth.uid() AND status IN ('draft','returned')) OR public.can_check(auth.uid()));
CREATE POLICY "requests_delete_draft" ON public.card_requests FOR DELETE TO authenticated
  USING (public.can_make(auth.uid()) AND maker_id = auth.uid() AND status = 'draft');
CREATE TRIGGER card_requests_updated BEFORE UPDATE ON public.card_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- APPROVAL HISTORY
CREATE TABLE public.request_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.card_requests(id) ON DELETE CASCADE,
  action public.approval_action NOT NULL,
  actor_id uuid REFERENCES auth.users(id),
  actor_role public.app_role,
  from_status public.request_status,
  to_status public.request_status,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.request_approvals TO authenticated;
GRANT ALL ON public.request_approvals TO service_role;
ALTER TABLE public.request_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approvals_read" ON public.request_approvals FOR SELECT TO authenticated USING (true);
CREATE POLICY "approvals_insert" ON public.request_approvals FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());

-- CARDS
CREATE TABLE public.cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_number text NOT NULL UNIQUE,
  masked_number text NOT NULL,
  card_type public.card_type NOT NULL,
  status public.card_status NOT NULL DEFAULT 'requested',
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  request_id uuid REFERENCES public.card_requests(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.card_products(id),
  fee_profile_id uuid REFERENCES public.fee_profiles(id),
  embossing_name text NOT NULL,
  expiry_month int NOT NULL,
  expiry_year int NOT NULL,
  card_limit numeric(18,2) NOT NULL DEFAULT 0,
  cash_limit numeric(18,2) NOT NULL DEFAULT 0,
  parent_card_id uuid REFERENCES public.cards(id) ON DELETE SET NULL,
  credit_shield boolean NOT NULL DEFAULT false,
  cbs_sync public.sync_status NOT NULL DEFAULT 'pending',
  cms_sync public.sync_status NOT NULL DEFAULT 'pending',
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.cards TO authenticated;
GRANT ALL ON public.cards TO service_role;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cards_read" ON public.cards FOR SELECT TO authenticated USING (true);
CREATE POLICY "cards_insert" ON public.cards FOR INSERT TO authenticated WITH CHECK (public.can_check(auth.uid()));
CREATE POLICY "cards_update" ON public.cards FOR UPDATE TO authenticated USING (public.can_check(auth.uid()));
CREATE TRIGGER cards_updated BEFORE UPDATE ON public.cards FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- INTEGRATION LOGS
CREATE TABLE public.integration_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system text NOT NULL,
  direction text NOT NULL,
  operation text NOT NULL,
  endpoint text,
  request_id uuid REFERENCES public.card_requests(id) ON DELETE SET NULL,
  http_status int,
  success boolean NOT NULL DEFAULT true,
  latency_ms int,
  request_payload jsonb,
  response_payload jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX integration_logs_created_idx ON public.integration_logs(created_at DESC);
GRANT SELECT ON public.integration_logs TO authenticated;
GRANT ALL ON public.integration_logs TO service_role;
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integration_logs_read" ON public.integration_logs FOR SELECT TO authenticated USING (true);

-- AUDIT TRAIL
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id),
  actor_name text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  reference_no text,
  before_data jsonb,
  after_data jsonb,
  changed_fields text[],
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_created_idx ON public.audit_logs(created_at DESC);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_read" ON public.audit_logs FOR SELECT TO authenticated USING (true);

-- BULK BATCHES
CREATE TABLE public.bulk_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  total_rows int NOT NULL DEFAULT 0,
  accepted_rows int NOT NULL DEFAULT 0,
  rejected_rows int NOT NULL DEFAULT 0,
  errors jsonb,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.bulk_batches TO authenticated;
GRANT ALL ON public.bulk_batches TO service_role;
ALTER TABLE public.bulk_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "batches_read" ON public.bulk_batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "batches_insert" ON public.bulk_batches FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid() AND public.can_make(auth.uid()));

-- reference number sequence
CREATE SEQUENCE public.card_request_seq START 1000;
GRANT USAGE, SELECT ON SEQUENCE public.card_request_seq TO authenticated, service_role;

-- SEED reference data
INSERT INTO public.card_products (product_code, product_name, card_type, scheme, currency, bin, min_limit, max_limit) VALUES
 ('PCC-CLS','Classic Credit Card','primary_credit','VISA','BDT','446789',20000,200000),
 ('PCC-GLD','Gold Credit Card','primary_credit','VISA','BDT','446790',100000,500000),
 ('PCC-PLT','Platinum Credit Card','primary_credit','MASTERCARD','BDT','552144',300000,2000000),
 ('SCC-GLD','Supplementary Gold','supplementary_credit','VISA','BDT','446790',20000,500000),
 ('BUS-CORP','Business Corporate Card','business','MASTERCARD','BDT','552145',200000,5000000),
 ('PRE-TRV','Prepaid Travel Card','prepaid','VISA','USD','446791',0,300000);

INSERT INTO public.fee_profiles (profile_code, profile_name, annual_fee, late_fee, cash_advance_rate, interest_rate, credit_shield_premium_rate) VALUES
 ('FEE-CLS','Classic Fee Profile',1500,500,2.500,20.000,0.450),
 ('FEE-GLD','Gold Fee Profile',3000,750,2.500,20.000,0.450),
 ('FEE-PLT','Platinum Fee Profile',6000,1000,2.000,18.000,0.400),
 ('FEE-BUS','Business Fee Profile',5000,1000,2.000,19.000,0.400),
 ('FEE-PRE','Prepaid Fee Profile',800,0,1.500,0.000,0.000);
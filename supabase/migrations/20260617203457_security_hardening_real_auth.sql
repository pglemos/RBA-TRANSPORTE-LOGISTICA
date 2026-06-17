-- Hardening para autenticação real Supabase, RLS por perfil e anexos privados.

CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_unique_idx
  ON public.profiles(user_id)
  WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.role
  FROM public.profiles p
  WHERE p.user_id = auth.uid()
    AND p.active = true
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.get_auth_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_auth_role() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_auth_role() TO authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freight_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freight_order_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freight_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freight_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'profiles',
        'drivers',
        'vehicles',
        'clients',
        'freight_orders',
        'freight_order_attachments',
        'freight_payments',
        'freight_expenses',
        'audit_logs',
        'app_settings'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', policy_record.policyname, policy_record.schemaname, policy_record.tablename);
  END LOOP;
END $$;

CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.get_auth_role() = 'Administrador');

CREATE POLICY "profiles_admin_all"
  ON public.profiles
  FOR ALL TO authenticated
  USING (public.get_auth_role() = 'Administrador')
  WITH CHECK (public.get_auth_role() = 'Administrador');

CREATE POLICY "drivers_read_authenticated"
  ON public.drivers
  FOR SELECT TO authenticated
  USING (public.get_auth_role() IS NOT NULL);

CREATE POLICY "drivers_write_admin_operational"
  ON public.drivers
  FOR ALL TO authenticated
  USING (public.get_auth_role() IN ('Administrador', 'Operacional'))
  WITH CHECK (public.get_auth_role() IN ('Administrador', 'Operacional'));

CREATE POLICY "vehicles_read_authenticated"
  ON public.vehicles
  FOR SELECT TO authenticated
  USING (public.get_auth_role() IS NOT NULL);

CREATE POLICY "vehicles_write_admin_operational"
  ON public.vehicles
  FOR ALL TO authenticated
  USING (public.get_auth_role() IN ('Administrador', 'Operacional'))
  WITH CHECK (public.get_auth_role() IN ('Administrador', 'Operacional'));

CREATE POLICY "clients_read_authenticated"
  ON public.clients
  FOR SELECT TO authenticated
  USING (public.get_auth_role() IS NOT NULL);

CREATE POLICY "clients_write_admin_operational"
  ON public.clients
  FOR ALL TO authenticated
  USING (public.get_auth_role() IN ('Administrador', 'Operacional'))
  WITH CHECK (public.get_auth_role() IN ('Administrador', 'Operacional'));

CREATE POLICY "orders_read_authenticated"
  ON public.freight_orders
  FOR SELECT TO authenticated
  USING (public.get_auth_role() IS NOT NULL);

CREATE POLICY "orders_insert_admin_operational"
  ON public.freight_orders
  FOR INSERT TO authenticated
  WITH CHECK (public.get_auth_role() IN ('Administrador', 'Operacional'));

CREATE POLICY "orders_update_business_roles"
  ON public.freight_orders
  FOR UPDATE TO authenticated
  USING (public.get_auth_role() IN ('Administrador', 'Operacional', 'Financeiro'))
  WITH CHECK (public.get_auth_role() IN ('Administrador', 'Operacional', 'Financeiro'));

CREATE POLICY "orders_delete_admin"
  ON public.freight_orders
  FOR DELETE TO authenticated
  USING (public.get_auth_role() = 'Administrador');

CREATE POLICY "attachments_read_authenticated"
  ON public.freight_order_attachments
  FOR SELECT TO authenticated
  USING (public.get_auth_role() IS NOT NULL);

CREATE POLICY "attachments_write_business_roles"
  ON public.freight_order_attachments
  FOR ALL TO authenticated
  USING (public.get_auth_role() IN ('Administrador', 'Operacional', 'Financeiro'))
  WITH CHECK (public.get_auth_role() IN ('Administrador', 'Operacional', 'Financeiro'));

CREATE POLICY "payments_read_authenticated"
  ON public.freight_payments
  FOR SELECT TO authenticated
  USING (public.get_auth_role() IS NOT NULL);

CREATE POLICY "payments_write_financial_roles"
  ON public.freight_payments
  FOR ALL TO authenticated
  USING (public.get_auth_role() IN ('Administrador', 'Financeiro'))
  WITH CHECK (public.get_auth_role() IN ('Administrador', 'Financeiro'));

CREATE POLICY "expenses_read_authenticated"
  ON public.freight_expenses
  FOR SELECT TO authenticated
  USING (public.get_auth_role() IS NOT NULL);

CREATE POLICY "expenses_write_financial_roles"
  ON public.freight_expenses
  FOR ALL TO authenticated
  USING (public.get_auth_role() IN ('Administrador', 'Financeiro'))
  WITH CHECK (public.get_auth_role() IN ('Administrador', 'Financeiro'));

CREATE POLICY "audit_logs_insert_authenticated"
  ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.get_auth_role() IS NOT NULL);

CREATE POLICY "audit_logs_read_admin_auditor"
  ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.get_auth_role() IN ('Administrador', 'Consulta/Auditoria'));

CREATE POLICY "settings_read_admin_auditor"
  ON public.app_settings
  FOR SELECT TO authenticated
  USING (public.get_auth_role() IN ('Administrador', 'Consulta/Auditoria'));

CREATE POLICY "settings_write_admin"
  ON public.app_settings
  FOR ALL TO authenticated
  USING (public.get_auth_role() = 'Administrador')
  WITH CHECK (public.get_auth_role() = 'Administrador');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'freight_orders_financial_nonnegative_check'
  ) THEN
    ALTER TABLE public.freight_orders
      ADD CONSTRAINT freight_orders_financial_nonnegative_check
      CHECK (
        freight_value >= 0
        AND advance_value >= 0
        AND cash_value >= 0
        AND balance_value >= 0
        AND loading_expense >= 0
        AND unloading_expense >= 0
        AND other_expenses >= 0
        AND total_expenses >= 0
        AND cte_value >= 0
        AND cte_discount_percent >= 0
        AND cte_discount_percent <= 100
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'freight_payments_amount_positive_check'
  ) THEN
    ALTER TABLE public.freight_payments
      ADD CONSTRAINT freight_payments_amount_positive_check
      CHECK (amount > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'freight_expenses_amount_nonnegative_check'
  ) THEN
    ALTER TABLE public.freight_expenses
      ADD CONSTRAINT freight_expenses_amount_nonnegative_check
      CHECK (amount >= 0);
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-attachments',
  'order-attachments',
  false,
  4000000,
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/xml', 'application/xml']
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

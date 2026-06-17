-- 002_rls_policies.sql
-- Políticas de Segurança RLS (Row Level Security) por perfil para o RBA Fretes Digital

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

DROP POLICY IF EXISTS "Leitura global de perfis" ON public.profiles;
CREATE POLICY "Leitura global de perfis" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin pode gerenciar perfis" ON public.profiles;
CREATE POLICY "Admin pode gerenciar perfis" ON public.profiles
  FOR ALL TO authenticated
  USING (public.get_auth_role() = 'Administrador');

DROP POLICY IF EXISTS "Leitura de motoristas" ON public.drivers;
CREATE POLICY "Leitura de motoristas" ON public.drivers
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin e Operacional podem gerenciar motoristas" ON public.drivers;
CREATE POLICY "Admin e Operacional podem gerenciar motoristas" ON public.drivers
  FOR ALL TO authenticated
  USING (public.get_auth_role() IN ('Administrador', 'Operacional'));

DROP POLICY IF EXISTS "Leitura de veículos" ON public.vehicles;
CREATE POLICY "Leitura de veículos" ON public.vehicles
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin e Operacional podem gerenciar veículos" ON public.vehicles;
CREATE POLICY "Admin e Operacional podem gerenciar veículos" ON public.vehicles
  FOR ALL TO authenticated
  USING (public.get_auth_role() IN ('Administrador', 'Operacional'));

DROP POLICY IF EXISTS "Leitura de clientes" ON public.clients;
CREATE POLICY "Leitura de clientes" ON public.clients
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin e Operacional podem gerenciar clientes" ON public.clients;
CREATE POLICY "Admin e Operacional podem gerenciar clientes" ON public.clients
  FOR ALL TO authenticated
  USING (public.get_auth_role() IN ('Administrador', 'Operacional'));

DROP POLICY IF EXISTS "Leitura de ordens" ON public.freight_orders;
CREATE POLICY "Leitura de ordens" ON public.freight_orders
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin e Operacional podem inserir ordens" ON public.freight_orders;
CREATE POLICY "Admin e Operacional podem inserir ordens" ON public.freight_orders
  FOR INSERT TO authenticated
  WITH CHECK (public.get_auth_role() IN ('Administrador', 'Operacional'));

DROP POLICY IF EXISTS "Permissões de edição de ordens" ON public.freight_orders;
CREATE POLICY "Permissões de edição de ordens" ON public.freight_orders
  FOR UPDATE TO authenticated
  USING (
    public.get_auth_role() IN ('Administrador', 'Financeiro')
    OR (
      public.get_auth_role() = 'Operacional'
      AND status IN ('Contratar', 'Carregando', 'Em Trânsito', 'Entregue', 'Rascunho', 'Em Análise')
    )
  )
  WITH CHECK (
    public.get_auth_role() IN ('Administrador', 'Financeiro')
    OR (
      public.get_auth_role() = 'Operacional'
      AND status IN ('Contratar', 'Carregando', 'Em Trânsito', 'Entregue', 'Rascunho', 'Em Análise')
    )
  );

DROP POLICY IF EXISTS "Deleção exclusiva do admin" ON public.freight_orders;
CREATE POLICY "Deleção exclusiva do admin" ON public.freight_orders
  FOR DELETE TO authenticated
  USING (public.get_auth_role() = 'Administrador');

DROP POLICY IF EXISTS "Leitura de anexos" ON public.freight_order_attachments;
CREATE POLICY "Leitura de anexos" ON public.freight_order_attachments
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin, Operacional e Financeiro podem enviar anexos" ON public.freight_order_attachments;
CREATE POLICY "Admin, Operacional e Financeiro podem enviar anexos" ON public.freight_order_attachments
  FOR ALL TO authenticated
  USING (public.get_auth_role() IN ('Administrador', 'Operacional', 'Financeiro'));

DROP POLICY IF EXISTS "Leitura de pagamentos" ON public.freight_payments;
CREATE POLICY "Leitura de pagamentos" ON public.freight_payments
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Gerência financeira" ON public.freight_payments;
CREATE POLICY "Gerência financeira" ON public.freight_payments
  FOR ALL TO authenticated
  USING (public.get_auth_role() IN ('Administrador', 'Financeiro'));

DROP POLICY IF EXISTS "Leitura de despesas" ON public.freight_expenses;
CREATE POLICY "Leitura de despesas" ON public.freight_expenses
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Gerência de despesas por admin e financeiro" ON public.freight_expenses;
CREATE POLICY "Gerência de despesas por admin e financeiro" ON public.freight_expenses
  FOR ALL TO authenticated
  USING (public.get_auth_role() IN ('Administrador', 'Financeiro'));

DROP POLICY IF EXISTS "Escrita livre para logs de auditoria" ON public.audit_logs;
CREATE POLICY "Escrita livre para logs de auditoria" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Leitura seleta de auditoria" ON public.audit_logs;
CREATE POLICY "Leitura seleta de auditoria" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.get_auth_role() IN ('Administrador', 'Consulta/Auditoria'));

DROP POLICY IF EXISTS "Leitura de configurações" ON public.app_settings;
CREATE POLICY "Leitura de configurações" ON public.app_settings
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Alteração de configurações" ON public.app_settings;
CREATE POLICY "Alteração de configurações" ON public.app_settings
  FOR ALL TO authenticated
  USING (public.get_auth_role() = 'Administrador');

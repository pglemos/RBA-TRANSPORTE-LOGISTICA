-- 002_rls_policies.sql
-- Políticas de Segurança RLS (Row Level Security) por perfil para o RBA Fretes Digital

-- Função auxiliar para obter o papel (role) do usuário autenticado no Supabase Auth
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

-- Ativação de RLS em todas as tabelas
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

-- 1. POLÍTICAS PARA PROFILES
-- Usuários podem ler todos os perfis (para saber quem é quem)
CREATE POLICY "Leitura global de perfis" ON public.profiles
    FOR SELECT TO authenticated USING (true);

-- Apenas Administradores podem atualizar perfis
CREATE POLICY "Admin pode gerenciar perfis" ON public.profiles
    FOR ALL TO authenticated USING (public.get_auth_role() = 'Administrador');

-- 2. POLÍTICAS PARA DRIVERS
-- Todos os autenticados podem ver motoristas
CREATE POLICY "Leitura de motoristas" ON public.drivers
    FOR SELECT TO authenticated USING (true);

-- Administrador e Operacional podem criar/editar/excluir motoristas
CREATE POLICY "Admin e Operacional podem gerenciar motoristas" ON public.drivers
    FOR ALL TO authenticated USING (public.get_auth_role() IN ('Administrador', 'Operacional'));

-- 3. POLÍTICAS PARA VEHICLES
-- Todos os autenticados podem ver veículos
CREATE POLICY "Leitura de veículos" ON public.vehicles
    FOR SELECT TO authenticated USING (true);

-- Administrador e Operacional podem criar/editar/excluir veículos
CREATE POLICY "Admin e Operacional podem gerenciar veículos" ON public.vehicles
    FOR ALL TO authenticated USING (public.get_auth_role() IN ('Administrador', 'Operacional'));

-- 4. POLÍTICAS PARA CLIENTS
-- Todos os autenticados podem ver clientes
CREATE POLICY "Leitura de clientes" ON public.clients
    FOR SELECT TO authenticated USING (true);

-- Administrador e Operacional podem criar/editar/excluir clientes
CREATE POLICY "Admin e Operacional podem gerenciar clientes" ON public.clients
    FOR ALL TO authenticated USING (public.get_auth_role() IN ('Administrador', 'Operacional'));

-- 5. POLÍTICAS PARA FREIGHT ORDERS
-- Todos os autenticados podem ver ordens de frete
CREATE POLICY "Leitura de ordens" ON public.freight_orders
    FOR SELECT TO authenticated USING (true);

-- Administrador e Operacional podem criar ordens de frete
CREATE POLICY "Admin e Operacional podem inserir ordens" ON public.freight_orders
    FOR INSERT TO authenticated WITH CHECK (public.get_auth_role() IN ('Administrador', 'Operacional'));

-- Administrador, Operacional e Financeiro podem editar ordens (o Operacional só se a ordem estiver em Rascunho/Em Análise; Financeiro/Admin sempre)
CREATE POLICY "Permissões de edição de ordens" ON public.freight_orders
    FOR UPDATE TO authenticated USING (
        public.get_auth_role() IN ('Administrador', 'Financeiro') OR 
        (public.get_auth_role() = 'Operacional' AND status IN ('Rascunho', 'Em Análise'))
    );

-- Apenas Administradores podem deletar ordens de frete
CREATE POLICY "Deleção exclusiva do admin" ON public.freight_orders
    FOR DELETE TO authenticated USING (public.get_auth_role() = 'Administrador');

-- 6. POLÍTICAS PARA ATTACHMENTS
CREATE POLICY "Leitura de anexos" ON public.freight_order_attachments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin, Operacional e Financeiro podem enviar anexos" ON public.freight_order_attachments
    FOR ALL TO authenticated USING (public.get_auth_role() IN ('Administrador', 'Operacional', 'Financeiro'));

-- 7. POLÍTICAS PARA PAYMENTS
-- Todos os autenticados podem visualizar pagamentos para conciliação
CREATE POLICY "Leitura de pagamentos" ON public.freight_payments
    FOR SELECT TO authenticated USING (true);

-- Apenas Administradores e Financeiro podem fazer operações de escrita
CREATE POLICY "Gerência de pagamentos por admin e financeiro" ON public.freight_payments
    FOR ALL TO authenticated USING (public.get_auth_role() IN ('Administrador', 'Financeiro'));

-- 8. POLÍTICAS PARA EXPENSES
CREATE POLICY "Leitura de despesas" ON public.freight_expenses
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gerência de despesas por admin e financeiro" ON public.freight_expenses
    FOR ALL TO authenticated USING (public.get_auth_role() IN ('Administrador', 'Financeiro'));

-- 9. POLÍTICAS PARA AUDIT LOGS
-- Todos os usuários podem gravar novos registros de auditoria à medida que realizam ações
CREATE POLICY "Escrita livre para logs de auditoria" ON public.audit_logs
    FOR INSERT TO authenticated WITH CHECK (true);

-- Apenas Admin e Consulta/Auditoria podem ler logs de auditoria
CREATE POLICY "Leitura seleta de auditoria" ON public.audit_logs
    FOR SELECT TO authenticated USING (public.get_auth_role() IN ('Administrador', 'Consulta/Auditoria'));

-- 10. POLÍTICAS PARA APP SETTINGS
-- Todos podem ler configurações
CREATE POLICY "Leitura de configurações" ON public.app_settings
    FOR SELECT TO authenticated USING (true);

-- Apenas Admin pode atualizar configurações
CREATE POLICY "Alteração de configurações" ON public.app_settings
    FOR ALL TO authenticated USING (public.get_auth_role() = 'Administrador');

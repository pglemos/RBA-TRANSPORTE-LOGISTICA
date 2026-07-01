-- 20260701041538_database_optimization.sql
-- Otimização do Banco de Dados: Conversão de datas de TEXT para DATE, criação de índices FKs e políticas do Storage.

-- 1. Conversão das colunas de data (TEXT -> DATE)
-- Freight Orders
ALTER TABLE public.freight_orders 
  ALTER COLUMN delivery_date TYPE DATE USING (NULLIF(delivery_date, '')::date);

-- Freight Payments
ALTER TABLE public.freight_payments 
  ALTER COLUMN payment_date TYPE DATE USING (NULLIF(payment_date, '')::date);

-- Freight Expenses
ALTER TABLE public.freight_expenses 
  ALTER COLUMN expense_date TYPE DATE USING (NULLIF(expense_date, '')::date);


-- 2. Criação de índices para otimização de buscas e JOINs
-- Índice de Veículo na Ordem de Frete (placa/modelo)
CREATE INDEX IF NOT EXISTS idx_freight_orders_vehicle 
  ON public.freight_orders(vehicle_id);

-- Índice de Ordem de Frete nas Despesas
CREATE INDEX IF NOT EXISTS idx_freight_expenses_order 
  ON public.freight_expenses(freight_order_id);


-- 3. Políticas de Segurança RLS para o Storage (order-attachments)
-- Permitir leitura de anexos para usuários autenticados
CREATE POLICY "attachments_read_policy" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'order-attachments');

-- Permitir upload de novos anexos para usuários autenticados
CREATE POLICY "attachments_insert_policy" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'order-attachments');

-- Permitir exclusão/atualização de anexos para usuários autenticados
CREATE POLICY "attachments_delete_update_policy" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'order-attachments')
  WITH CHECK (bucket_id = 'order-attachments');

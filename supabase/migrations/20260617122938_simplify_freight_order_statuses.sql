DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  FOR constraint_record IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN unnest(c.conkey) AS cols(attnum) ON TRUE
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = cols.attnum
    WHERE c.conrelid = 'public.freight_orders'::regclass
      AND c.contype = 'c'
      AND a.attname IN ('status', 'shipment_release_status')
  LOOP
    EXECUTE format('ALTER TABLE public.freight_orders DROP CONSTRAINT IF EXISTS %I', constraint_record.conname);
  END LOOP;
END $$;

ALTER TABLE public.freight_orders
  ALTER COLUMN status SET DEFAULT 'Contratar',
  ALTER COLUMN shipment_release_status SET DEFAULT 'Contratar';

UPDATE public.freight_orders
SET
  status = CASE
    WHEN status = 'Carregando' THEN 'Carregando'
    WHEN status IN ('Em Trânsito', 'Em Viagem') THEN 'Em Trânsito'
    WHEN status IN ('Entregue', 'Pago') THEN 'Entregue'
    ELSE 'Contratar'
  END,
  shipment_release_status = CASE
    WHEN shipment_release_status = 'Carregando' THEN 'Carregando'
    WHEN shipment_release_status IN ('Em Trânsito', 'Em Viagem') THEN 'Em Trânsito'
    WHEN shipment_release_status IN ('Entregue', 'Pago') THEN 'Entregue'
    WHEN shipment_release_status = 'Liberado' THEN 'Carregando'
    ELSE 'Contratar'
  END;

ALTER TABLE public.freight_orders
  ADD CONSTRAINT freight_orders_status_check
    CHECK (status IN ('Contratar', 'Carregando', 'Em Trânsito', 'Entregue')),
  ADD CONSTRAINT freight_orders_shipment_release_status_check
    CHECK (shipment_release_status IN ('Contratar', 'Carregando', 'Em Trânsito', 'Entregue'));

DROP POLICY IF EXISTS "Permissões de edição de ordens" ON public.freight_orders;

CREATE POLICY "Permissões de edição de ordens" ON public.freight_orders
  FOR UPDATE TO authenticated
  USING (
    public.get_auth_role() IN ('Administrador', 'Financeiro')
    OR (
      public.get_auth_role() = 'Operacional'
      AND status IN ('Contratar', 'Carregando', 'Em Trânsito', 'Entregue')
    )
  )
  WITH CHECK (
    public.get_auth_role() IN ('Administrador', 'Financeiro')
    OR (
      public.get_auth_role() = 'Operacional'
      AND status IN ('Contratar', 'Carregando', 'Em Trânsito', 'Entregue')
    )
  );

ALTER TABLE public.freight_orders
DROP CONSTRAINT IF EXISTS freight_orders_status_check;

ALTER TABLE public.freight_orders
ADD CONSTRAINT freight_orders_status_check
CHECK (
  status IN (
    'Rascunho',
    'Em Análise',
    'Aprovado',
    'Liberado para Embarque',
    'Carregando',
    'Em Viagem',
    'Entregue',
    'Pago',
    'Cancelado'
  )
);

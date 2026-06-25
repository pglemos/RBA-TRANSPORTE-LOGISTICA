ALTER TABLE public.freight_orders
ADD COLUMN IF NOT EXISTS updated_by TEXT NOT NULL DEFAULT '';

UPDATE public.freight_orders
SET updated_by = COALESCE(NULLIF(updated_by, ''), created_by, responsible_name, '')
WHERE updated_by = '';


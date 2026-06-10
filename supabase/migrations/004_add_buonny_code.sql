ALTER TABLE public.freight_orders
ADD COLUMN IF NOT EXISTS buonny_code TEXT NOT NULL DEFAULT '';

ALTER TABLE public.freight_orders
DROP CONSTRAINT IF EXISTS freight_orders_buonny_code_length;

ALTER TABLE public.freight_orders
ADD CONSTRAINT freight_orders_buonny_code_length
CHECK (char_length(buonny_code) <= 20);

ALTER TABLE public.freight_orders
ADD COLUMN IF NOT EXISTS buonny_responsible TEXT NOT NULL DEFAULT '';

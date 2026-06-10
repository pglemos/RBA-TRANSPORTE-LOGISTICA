-- Persist the editable emission date printed in the freight order footer.
ALTER TABLE public.freight_orders
    ADD COLUMN IF NOT EXISTS emission_day TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS emission_month TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS emission_year TEXT NOT NULL DEFAULT '';

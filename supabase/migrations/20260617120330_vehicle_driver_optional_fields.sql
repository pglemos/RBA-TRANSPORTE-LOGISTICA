ALTER TABLE public.drivers
  ALTER COLUMN rg DROP NOT NULL,
  ALTER COLUMN bank_name DROP NOT NULL,
  ALTER COLUMN bank_agency DROP NOT NULL,
  ALTER COLUMN bank_account DROP NOT NULL;

ALTER TABLE public.freight_orders
  ALTER COLUMN delivery_date DROP NOT NULL;

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS manufacture_year INTEGER,
  ADD COLUMN IF NOT EXISTS model_year INTEGER,
  ADD COLUMN IF NOT EXISTS vehicle_type TEXT NOT NULL DEFAULT 'Truck';

UPDATE public.vehicles
SET
  manufacture_year = COALESCE(manufacture_year, year),
  model_year = COALESCE(model_year, year),
  vehicle_type = COALESCE(NULLIF(vehicle_type, ''), 'Truck');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'vehicles_vehicle_type_check'
      AND conrelid = 'public.vehicles'::regclass
  ) THEN
    ALTER TABLE public.vehicles
      ADD CONSTRAINT vehicles_vehicle_type_check
      CHECK (vehicle_type IN ('Utilitário', 'VUC', '3/4', 'Toco', 'Truck', 'Carreta'));
  END IF;
END $$;

ALTER TABLE public.vehicles
  DROP CONSTRAINT IF EXISTS vehicles_vehicle_type_check;

ALTER TABLE public.vehicles
  ADD CONSTRAINT vehicles_vehicle_type_check
  CHECK (vehicle_type IN ('Utilitário', 'VUC', '3/4', 'Toco', 'Truck', 'Bitruck', 'Carreta'));

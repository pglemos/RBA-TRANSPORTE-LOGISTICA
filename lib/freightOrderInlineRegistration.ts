import type { Driver, Vehicle } from './db';
import {
  DriverSchema,
  VehicleSchema,
  normalizeDocument,
  normalizePlate,
  normalizeUf,
  onlyDigits,
} from './validators.ts';

export type InlineDriverInput = Partial<
  Pick<
    Driver,
    | 'name'
    | 'cpf'
    | 'rg'
    | 'phone'
    | 'bank_name'
    | 'bank_agency'
    | 'bank_account'
    | 'pix_key'
    | 'beneficiary_name'
    | 'beneficiary_document'
    | 'status'
    | 'notes'
  >
>;

export type InlineVehicleInput = Partial<
  Pick<
    Vehicle,
    | 'tractor_plate'
    | 'trailer_plate'
    | 'year'
    | 'manufacture_year'
    | 'model_year'
    | 'vehicle_type'
    | 'model'
    | 'owner_name'
    | 'owner_document'
    | 'antt'
    | 'renavam'
    | 'uf'
    | 'status'
    | 'notes'
  >
>;

export function normalizeInlineDriverPayload(input: InlineDriverInput = {}) {
  const cpf = normalizeDocument(input.cpf || '');
  const name = String(input.name || '').trim();

  return {
    name,
    cpf,
    rg: String(input.rg || '').trim(),
    phone: onlyDigits(input.phone || ''),
    bank_name: String(input.bank_name || '').trim(),
    bank_agency: String(input.bank_agency || '').trim(),
    bank_account: String(input.bank_account || '').trim(),
    pix_key: String(input.pix_key || cpf).trim(),
    beneficiary_name: String(input.beneficiary_name || name).trim(),
    beneficiary_document: normalizeDocument(input.beneficiary_document || cpf),
    status: input.status || 'Ativo',
    notes: String(input.notes || '').trim(),
  };
}

export function normalizeInlineVehiclePayload(input: InlineVehicleInput = {}) {
  const vehicleType = input.vehicle_type || 'Carreta';
  const tractorPlate = normalizePlate(input.tractor_plate || '');
  const manufactureYear = Number(input.manufacture_year || input.year);
  const modelYear = Number(input.model_year || input.year || input.manufacture_year);

  return {
    tractor_plate: tractorPlate,
    trailer_plate: normalizePlate(input.trailer_plate || ''),
    year: manufactureYear,
    manufacture_year: manufactureYear,
    model_year: modelYear,
    vehicle_type: vehicleType,
    model: String(input.model || vehicleType || tractorPlate).trim(),
    owner_name: String(input.owner_name || '').trim(),
    owner_document: normalizeDocument(input.owner_document || ''),
    antt: String(input.antt || '').trim(),
    renavam: String(input.renavam || '').trim(),
    uf: normalizeUf(input.uf || ''),
    status: input.status || 'Ativo',
    notes: String(input.notes || '').trim(),
  };
}

export function parseInlineDriverPayload(input: InlineDriverInput = {}) {
  return DriverSchema.safeParse(normalizeInlineDriverPayload(input));
}

export function parseInlineVehiclePayload(input: InlineVehicleInput = {}) {
  return VehicleSchema.safeParse(normalizeInlineVehiclePayload(input));
}

export function findDriverByCpf(drivers: Driver[], cpf: string) {
  const normalizedCpf = normalizeDocument(cpf);
  if (!normalizedCpf) return undefined;
  return drivers.find((driver) => normalizeDocument(driver.cpf) === normalizedCpf);
}

export function findVehicleByTractorPlate(vehicles: Vehicle[], tractorPlate: string) {
  const normalizedPlate = normalizePlate(tractorPlate);
  if (!normalizedPlate) return undefined;
  return vehicles.find((vehicle) => normalizePlate(vehicle.tractor_plate) === normalizedPlate);
}

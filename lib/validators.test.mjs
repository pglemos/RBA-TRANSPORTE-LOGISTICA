import test from 'node:test';
import assert from 'node:assert/strict';

import { DriverSchema, FreightOrderSchema, VehicleSchema } from './validators.ts';
import { syncFreightOrderStatuses } from './freightStatus.ts';

const validCpf = '52998224725';
const validCnpj = '11222333000181';

test('DriverSchema accepts driver registration without bank, agency and account', () => {
  const result = DriverSchema.safeParse({
    name: 'Joao da Silva',
    cpf: validCpf,
    rg: '1234567',
    phone: '11999999999',
    bank_name: '',
    bank_agency: '',
    bank_account: '',
    pix_key: validCpf,
    beneficiary_name: 'Joao da Silva',
    beneficiary_document: validCpf,
    status: 'Ativo',
  });

  assert.equal(result.success, true);
});

test('VehicleSchema stores fabrication year, model year and vehicle type', () => {
  const result = VehicleSchema.safeParse({
    model: 'Ford Cargo',
    vehicle_type: 'Truck',
    manufacture_year: 2020,
    model_year: 2021,
    year: 2020,
    tractor_plate: 'ABC1D23',
    trailer_plate: '',
    uf: 'SP',
    owner_name: 'RBA Transporte',
    owner_document: validCnpj,
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.vehicle_type, 'Truck');
    assert.equal(result.data.manufacture_year, 2020);
    assert.equal(result.data.model_year, 2021);
    assert.equal(result.data.trailer_plate, '');
  }
});

test('VehicleSchema accepts Bitruck vehicle type', () => {
  const result = VehicleSchema.safeParse({
    model: 'Mercedes-Benz Atego 2430',
    vehicle_type: 'Bitruck',
    manufacture_year: 2021,
    model_year: 2022,
    year: 2021,
    tractor_plate: 'ABC1D23',
    trailer_plate: '',
    uf: 'SP',
    owner_name: 'RBA Transporte',
    owner_document: validCnpj,
  });

  assert.equal(result.success, true);
});

test('VehicleSchema still requires trailer plate for carreta', () => {
  const result = VehicleSchema.safeParse({
    model: 'Scania R450',
    vehicle_type: 'Carreta',
    manufacture_year: 2020,
    model_year: 2021,
    year: 2020,
    tractor_plate: 'ABC1D23',
    trailer_plate: '',
    uf: 'SP',
    owner_name: 'RBA Transporte',
    owner_document: validCnpj,
  });

  assert.equal(result.success, false);
});

test('FreightOrderSchema accepts empty delivery date', () => {
  const result = FreightOrderSchema.safeParse({
    driver_id: 'drv_1',
    vehicle_id: 'vhc_1',
    client_id: 'cli_1',
    freight_value: 1000,
    advance_value: 0,
    cash_value: 0,
    origin: 'Sao Paulo - SP',
    destination: 'Curitiba - PR',
    delivery_date: '',
  });

  assert.equal(result.success, true);
});

test('FreightOrderSchema accepts only the simplified freight status flow', () => {
  const baseOrder = {
    driver_id: 'drv_1',
    vehicle_id: 'vhc_1',
    client_id: 'cli_1',
    freight_value: 1000,
    advance_value: 0,
    cash_value: 0,
    origin: 'Sao Paulo - SP',
    destination: 'Curitiba - PR',
    delivery_date: '',
  };

  for (const status of ['Contratar', 'Carregando', 'Em Trânsito', 'Entregue']) {
    assert.equal(FreightOrderSchema.safeParse({ ...baseOrder, status }).success, true);
  }

  for (const status of ['Rascunho', 'Em Análise', 'Aprovado', 'Liberado para Embarque', 'Em Viagem', 'Pago', 'Cancelado']) {
    assert.equal(FreightOrderSchema.safeParse({ ...baseOrder, status }).success, false);
  }
});

test('syncFreightOrderStatuses keeps general status aligned with shipment release choice', () => {
  assert.deepEqual(
    syncFreightOrderStatuses({ status: 'Contratar', shipment_release_status: 'Em Trânsito' }),
    { status: 'Em Trânsito', shipment_release_status: 'Em Trânsito' },
  );

  assert.deepEqual(
    syncFreightOrderStatuses({ status: 'Rascunho', shipment_release_status: '' }),
    { status: 'Contratar', shipment_release_status: 'Contratar' },
  );
});

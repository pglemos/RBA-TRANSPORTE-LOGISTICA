import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findDriverByCpf,
  findVehicleByTractorPlate,
  normalizeInlineDriverPayload,
  normalizeInlineVehiclePayload,
} from './freightOrderInlineRegistration.ts';

test('inline driver defaults pix and beneficiary data from CPF and name', () => {
  const driver = normalizeInlineDriverPayload({
    name: 'Joao Motorista',
    cpf: '529.982.247-25',
    phone: '(11) 99999-9999',
  });

  assert.equal(driver.cpf, '52998224725');
  assert.equal(driver.phone, '11999999999');
  assert.equal(driver.pix_key, '52998224725');
  assert.equal(driver.beneficiary_name, 'Joao Motorista');
  assert.equal(driver.beneficiary_document, '52998224725');
});

test('inline driver preserves pix key provided by freight form', () => {
  const driver = normalizeInlineDriverPayload({
    name: 'Joao Motorista',
    cpf: '529.982.247-25',
    phone: '(11) 99999-9999',
    pix_key: 'joao@transportes.com',
  });

  assert.equal(driver.pix_key, 'joao@transportes.com');
});

test('inline vehicle normalizes plate, owner document and UF', () => {
  const vehicle = normalizeInlineVehiclePayload({
    tractor_plate: 'abc-1d23',
    trailer_plate: 'def-4567',
    manufacture_year: 2020,
    model_year: 2021,
    vehicle_type: 'Carreta',
    model: 'DAF/XF FTS 480',
    owner_name: 'Transportadora Teste',
    owner_document: '11.444.777/0001-61',
    uf: 'sp',
  });

  assert.equal(vehicle.tractor_plate, 'ABC1D23');
  assert.equal(vehicle.trailer_plate, 'DEF4567');
  assert.equal(vehicle.owner_document, '11444777000161');
  assert.equal(vehicle.uf, 'SP');
  assert.equal(vehicle.model, 'DAF/XF FTS 480');
});

test('inline lookup reuses existing driver by CPF and vehicle by tractor plate', () => {
  const driver = { id: 'drv_1', cpf: '52998224725' };
  const vehicle = { id: 'vhc_1', tractor_plate: 'ABC1D23' };

  assert.equal(findDriverByCpf([driver], '529.982.247-25')?.id, 'drv_1');
  assert.equal(findVehicleByTractorPlate([vehicle], 'abc-1d23')?.id, 'vhc_1');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatFreightOrderEmissionDate,
  formatFreightOrderEmissionLongDate,
  getFreightOrderEmissionDateValue,
} from './freightOrderDates.ts';

test('uses freight order emission fields as the effective order date', () => {
  const order = {
    emission_day: '30',
    emission_month: 'Junho',
    emission_year: '26',
    created_at: '2026-07-03T14:00:00.000Z',
  };

  assert.equal(getFreightOrderEmissionDateValue(order), '2026-06-30');
  assert.equal(formatFreightOrderEmissionDate(order), '30/06/2026');
  assert.equal(formatFreightOrderEmissionLongDate(order), '30 de Junho de 2026');
});

test('falls back to created_at when emission fields are incomplete', () => {
  const order = {
    emission_day: '',
    emission_month: '',
    emission_year: '',
    created_at: '2026-07-03T14:00:00.000Z',
  };

  assert.equal(getFreightOrderEmissionDateValue(order), '2026-07-03');
  assert.equal(formatFreightOrderEmissionDate(order), '03/07/2026');
});

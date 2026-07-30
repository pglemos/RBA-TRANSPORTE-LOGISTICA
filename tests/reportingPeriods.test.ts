import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getMonthRange,
  getPreviousEquivalentRange,
  getPreviousYearRange,
  getYearRange,
} from '../lib/reporting/periods.ts';

test('creates the exact date range for a selected month', () => {
  assert.deepEqual(getMonthRange(2026, 7), {
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    label: 'Julho de 2026',
  });
});

test('supports leap years when building a month range', () => {
  assert.equal(getMonthRange(2024, 2).endDate, '2024-02-29');
});

test('creates the exact range for a selected year', () => {
  assert.deepEqual(getYearRange(2026), {
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    label: 'Ano de 2026',
  });
});

test('creates an immediately previous period with the same number of days', () => {
  assert.deepEqual(
    getPreviousEquivalentRange({ startDate: '2026-07-01', endDate: '2026-07-29', label: 'Período atual' }),
    { startDate: '2026-06-02', endDate: '2026-06-30', label: 'Período anterior equivalente' },
  );
});

test('creates the same calendar period in the previous year', () => {
  assert.deepEqual(
    getPreviousYearRange({ startDate: '2026-07-01', endDate: '2026-07-29', label: 'Período atual' }),
    { startDate: '2025-07-01', endDate: '2025-07-29', label: 'Mesmo período de 2025' },
  );
});

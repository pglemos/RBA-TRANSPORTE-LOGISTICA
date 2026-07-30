
import test from 'node:test';
import assert from 'node:assert/strict';

import { buildReportAnalytics } from '../lib/reporting/analytics.ts';
import { buildReportingOrders } from '../lib/reporting/orders.ts';
import { clampRangeToDate, filterOrdersByEmissionRange, getPreviousMonthEquivalentRange } from '../lib/reporting/reportAudit.ts';

const source = (overrides: Record<string, unknown> = {}) => ({
  id: '1', order_number: 'RBA-1', cte_number: ' 8430/ 4279 / 8434 ', client_id: 'c1', client_name: 'Cliente', driver_id: 'd1', driver_name: 'Motorista',
  origin: 'GRARULHOS  -SP', destination: 'SÃO JÕAO EVANGELISTA - MG', status: 'Entregue', cte_value: 1000, cte_discount_percent: 10,
  cte_discount_value: 100, net_revenue: 900, freight_value: 600, advance_value: 300, cash_value: 0, balance_value: 200,
  loading_expense: 0, unloading_expense: 0, other_expenses: 0, total_expenses: 0, net_value: 300,
  ...overrides,
});

const adapt = (rows: Record<string, unknown>[]) => buildReportingOrders(rows, {
  normalizeStatus: (value) => String(value),
  formatEmissionDate: (order) => String(order.emission_date_label || '01/07/2026'),
  getEmissionDateValue: (order) => String(order.emission_date_value || '2026-07-01'),
});

test('strictly filters report rows by emission date', () => {
  const rows = adapt([source({ id: 'june', emission_date_value: '2026-06-30' }), source({ id: 'july' })]);
  assert.deepEqual(filterOrdersByEmissionRange(rows, { startDate: '2026-07-01', endDate: '2026-07-31' }).map((item) => item.id), ['july']);
});

test('marks an open month as partial and compares the same ordinal days of the previous month', () => {
  const range = clampRangeToDate({ startDate: '2026-07-01', endDate: '2026-07-31', label: 'Julho de 2026' }, new Date(2026, 6, 30, 9));
  assert.equal(range.endDate, '2026-07-30');
  assert.match(range.label, /parcial até 30\/07\/2026/);
  assert.deepEqual(getPreviousMonthEquivalentRange(range), {
    startDate: '2026-06-01', endDate: '2026-06-30', label: 'Mês anterior equivalente (01/06/2026 a 30/06/2026)',
  });
});

test('uses financial CTE share for leading client dependency and exposes reconciliation fields', () => {
  const rows = adapt([
    source({ id: '1', client_id: 'a', client_name: 'A', cte_value: 800 }),
    source({ id: '2', client_id: 'b', client_name: 'B', cte_value: 200, freight_value: 400, advance_value: 0, balance_value: 0, cte_discount_value: 20, net_revenue: 180 }),
  ]);
  const analytics = buildReportAnalytics(rows, '2026-07-30');
  assert.equal(analytics.recurrence.leadingClientDependencyPercent, 80);
  assert.equal(analytics.summary.totalRecordedDiscountValue, 120);
  assert.equal(analytics.summary.totalUnclassifiedPaymentValue, 500);
  assert.equal(analytics.summary.unclassifiedPaymentOrderCount, 2);
});

test('normalizes known spacing and spelling defects only in the reporting projection', () => {
  const [row] = adapt([source()]);
  assert.equal(row.cteNumber, '8430 / 4279 / 8434');
  assert.equal(row.origin, 'GUARULHOS - SP');
  assert.equal(row.destination, 'SÃO JOÃO EVANGELISTA - MG');
});

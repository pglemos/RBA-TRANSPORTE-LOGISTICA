import test from 'node:test';
import assert from 'node:assert/strict';

import {
  APPENDIX_ROWS_PER_PAGE,
  buildPrintPagePlan,
  chunkForPrint,
  selectAppendixOrders,
} from '../lib/reporting/printLayout.ts';
import type { ReportingOrder } from '../lib/reporting/types.ts';

const order = (id: string, status: string): ReportingOrder => ({
  id,
  orderNumber: `RBA-${id}`,
  cteNumber: `CTE-${id}`,
  emissionDate: '30/07/2026',
  emissionDateValue: '2026-07-30',
  clientId: 'cliente',
  clientName: 'Cliente',
  driverId: 'motorista',
  driverName: 'Motorista',
  origin: 'Betim - MG',
  destination: 'São Paulo - SP',
  status,
  cteValue: 1000,
  freightValue: 500,
  advanceValue: 200,
  cashValue: 0,
  balanceValue: 300,
  loadingExpense: 10,
  unloadingExpense: 10,
  otherExpenses: 0,
  totalExpenses: 20,
  netValue: 480,
});

test('executive report with 119 orders reproduces the 16-page premium structure', () => {
  const plan = buildPrintPagePlan('executive', 119, true);
  assert.equal(APPENDIX_ROWS_PER_PAGE, 20);
  assert.equal(plan.length, 16);
  assert.equal(plan.filter((page) => page.type === 'appendix').length, 6);
  assert.equal(plan[0].key, 'cover');
  assert.equal(plan[9].key, 'governance');
});

test('executive report with 85 orders creates 10 executive pages plus 5 appendix pages', () => {
  const plan = buildPrintPagePlan('executive', 85, true);
  assert.equal(plan.length, 15);
  assert.deepEqual(plan.at(-1), {
    key: 'appendix-5',
    type: 'appendix',
    title: 'Apêndice operacional',
    pageIndex: 4,
    startIndex: 80,
    endIndex: 85,
  });
});

test('executive report without details keeps only the ten board pages', () => {
  const plan = buildPrintPagePlan('executive', 119, false);
  assert.equal(plan.length, 10);
  assert.equal(plan.some((page) => page.type === 'appendix'), false);
});

test('in-progress report always includes its operational appendix', () => {
  const plan = buildPrintPagePlan('in-progress', 21, false);
  assert.equal(plan.filter((page) => page.type === 'appendix').length, 2);
});

test('every report model contains cover, insights and governance pages', () => {
  const kinds = ['executive', 'expenses', 'profits', 'clients', 'drivers', 'routes', 'recurrence', 'in-progress'] as const;
  for (const kind of kinds) {
    const keys = buildPrintPagePlan(kind, 0, false).map((page) => page.key);
    assert.equal(keys[0], 'cover');
    assert.ok(keys.includes('insights'));
    assert.ok(keys.includes('governance'));
  }
});

test('chunkForPrint never creates an empty trailing page', () => {
  assert.deepEqual(chunkForPrint([], 20), []);
  assert.deepEqual(chunkForPrint([1, 2, 3], 2), [[1, 2], [3]]);
  assert.deepEqual(chunkForPrint([1, 2, 3, 4], 2), [[1, 2], [3, 4]]);
  assert.throws(() => chunkForPrint([1], 0), /maior que zero/);
});

test('appendix order selection is shared and keeps only active statuses for in-progress reports', () => {
  const orders = [
    order('1', 'Entregue'),
    order('2', 'Contratar'),
    order('3', 'Carregando'),
    order('4', 'Em Trânsito'),
  ];

  assert.deepEqual(
    selectAppendixOrders({ kind: 'in-progress', orders }).map((item) => item.id),
    ['2', '3', '4'],
  );
  assert.equal(selectAppendixOrders({ kind: 'executive', orders }).length, 4);
});

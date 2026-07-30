import test from 'node:test';
import assert from 'node:assert/strict';

import { buildReportAnalytics } from '../lib/reporting/analytics.ts';
import type { ReportingOrder } from '../lib/reporting/types.ts';

const orders: ReportingOrder[] = [
  {
    id: '1', orderNumber: 'RBA-1', cteNumber: 'CTE-1', emissionDate: '01/07/2026', emissionDateValue: '2026-07-01',
    clientId: 'c1', clientName: 'Cliente Alfa', driverId: 'd1', driverName: 'Motorista Um',
    origin: 'Betim - MG', destination: 'São Paulo - SP', status: 'Entregue',
    cteValue: 10000, freightValue: 6000, advanceValue: 2000, cashValue: 1000, balanceValue: 3000,
    loadingExpense: 100, unloadingExpense: 200, otherExpenses: 50, totalExpenses: 350, netValue: 3650,
  },
  {
    id: '2', orderNumber: 'RBA-2', cteNumber: 'CTE-2', emissionDate: '05/07/2026', emissionDateValue: '2026-07-05',
    clientId: 'c1', clientName: 'Cliente Alfa', driverId: 'd2', driverName: 'Motorista Dois',
    origin: 'Betim - MG', destination: 'Rio de Janeiro - RJ', status: 'Em Trânsito',
    cteValue: 8000, freightValue: 5000, advanceValue: 1000, cashValue: 0, balanceValue: 4000,
    loadingExpense: 80, unloadingExpense: 120, otherExpenses: 0, totalExpenses: 200, netValue: 2800,
  },
  {
    id: '3', orderNumber: 'RBA-3', cteNumber: 'CTE-3', emissionDate: '12/07/2026', emissionDateValue: '2026-07-12',
    clientId: 'c2', clientName: 'Cliente Beta', driverId: 'd1', driverName: 'Motorista Um',
    origin: 'Contagem - MG', destination: 'São Paulo - SP', status: 'Carregando',
    cteValue: 12000, freightValue: 7000, advanceValue: 2500, cashValue: 0, balanceValue: 4500,
    loadingExpense: 150, unloadingExpense: 250, otherExpenses: 100, totalExpenses: 500, netValue: 4500,
  },
];

test('aggregates persisted financial and operational values without recalculating orders', () => {
  const analytics = buildReportAnalytics(orders);

  assert.equal(analytics.summary.totalOrders, 3);
  assert.equal(analytics.summary.totalCteValue, 30000);
  assert.equal(analytics.summary.totalFreightValue, 18000);
  assert.equal(analytics.summary.totalExpenses, 1050);
  assert.equal(analytics.summary.totalNetValue, 10950);
  assert.equal(analytics.summary.marginPercent, 36.5);
  assert.equal(analytics.summary.deliveredPercent, 33.3);
});

test('ranks clients, drivers and routes by relevant values', () => {
  const analytics = buildReportAnalytics(orders);

  assert.equal(analytics.clients[0].label, 'Cliente Alfa');
  assert.equal(analytics.clients[0].orderCount, 2);
  assert.equal(analytics.drivers[0].label, 'Motorista Um');
  assert.equal(analytics.drivers[0].orderCount, 2);
  assert.equal(analytics.routes[0].label, 'Contagem - MG → São Paulo - SP');
});

test('builds expenses, status and recurrence breakdowns', () => {
  const analytics = buildReportAnalytics(orders);

  assert.deepEqual(analytics.expenses.map((item) => item.value), [330, 570, 150]);
  assert.equal(analytics.statuses.find((item) => item.label === 'Em Trânsito')?.orderCount, 1);
  assert.equal(analytics.recurrence.clients, 1);
  assert.equal(analytics.recurrence.drivers, 1);
  assert.equal(analytics.inProgress.length, 2);
});

test('builds client-route recurrence, profit buckets and in-progress aging', () => {
  const extendedOrders: ReportingOrder[] = [
    ...orders,
    {
      ...orders[0],
      id: '4',
      orderNumber: 'RBA-4',
      cteNumber: 'CTE-4',
      emissionDate: '20/07/2026',
      emissionDateValue: '2026-07-20',
      status: 'Contratar',
      cteValue: 4000,
      netValue: 0,
    },
    {
      ...orders[0],
      id: '5',
      orderNumber: 'RBA-5',
      cteNumber: 'CTE-5',
      emissionDate: '22/07/2026',
      emissionDateValue: '2026-07-22',
      clientId: 'c3',
      clientName: 'Cliente Gama',
      netValue: -250,
    },
  ];

  const analytics = buildReportAnalytics(extendedOrders, '2026-07-31');

  assert.equal(analytics.clientRoutes[0].label, 'Cliente Alfa · Betim - MG → São Paulo - SP');
  assert.equal(analytics.clientRoutes[0].orderCount, 2);
  assert.equal(analytics.recurrence.clientRoutes, 1);
  assert.equal(analytics.recurrence.leadingClientDependencyPercent, 60);
  assert.equal(analytics.profitBuckets.find((item) => item.key === 'positive')?.orderCount, 3);
  assert.equal(analytics.profitBuckets.find((item) => item.key === 'neutral')?.orderCount, 1);
  assert.equal(analytics.profitBuckets.find((item) => item.key === 'negative')?.orderCount, 1);
  assert.equal(analytics.inProgressSummary.totalOrders, 3);
  assert.equal(analytics.inProgressSummary.oldestOpenDays, 26);
  assert.equal(analytics.inProgressSummary.averageOpenDays, 19);
});

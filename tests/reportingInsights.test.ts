import test from 'node:test';
import assert from 'node:assert/strict';

import { buildReportComparison, buildReportInsights } from '../lib/reporting/insights.ts';
import type { ReportAnalytics } from '../lib/reporting/types.ts';

const analytics = (overrides: Partial<ReportAnalytics['summary']> = {}): ReportAnalytics => ({
  summary: {
    totalOrders: 20,
    totalCteValue: 200000,
    totalFreightValue: 110000,
    totalAdvanceValue: 30000,
    totalCashValue: 10000,
    totalBalanceValue: 70000,
    totalExpenses: 10000,
    totalNetValue: 80000,
    averageCteValue: 10000,
    averageNetValue: 4000,
    marginPercent: 40,
    expenseRatioPercent: 5,
    deliveredCount: 16,
    inTransitCount: 2,
    loadingCount: 1,
    contractingCount: 1,
    deliveredPercent: 80,
    ...overrides,
  },
  clients: [{ key: 'c1', label: 'Cliente Principal', orderCount: 12, cteValue: 140000, netValue: 56000, expenses: 7000, averageCteValue: 11666.67, sharePercent: 70 }],
  drivers: [],
  routes: [],
  clientRoutes: [],
  origins: [],
  destinations: [],
  statuses: [],
  expenses: [],
  profitBuckets: [],
  timeSeries: [],
  inProgress: [],
  inProgressSummary: {
    totalOrders: 0,
    totalCteValue: 0,
    totalNetValue: 0,
    averageOpenDays: 0,
    oldestOpenDays: 0,
    byStatus: [],
    byClient: [],
    byRoute: [],
  },
  recurrence: {
    clients: 3,
    drivers: 4,
    routes: 2,
    clientRoutes: 2,
    recurringClientOrderPercent: 70,
    recurringDriverOrderPercent: 65,
    recurringRouteOrderPercent: 55,
    recurringClientRouteOrderPercent: 40,
    leadingClientDependencyPercent: 60,
  },
});

const hasInsight = (
  insights: ReturnType<typeof buildReportInsights>,
  kind: ReturnType<typeof buildReportInsights>[number]['kind'],
  titleFragment: string,
) => insights.some((item) => item.kind === kind && item.title.toLocaleLowerCase('pt-BR').includes(titleFragment));

test('calculates percentage deltas against comparable periods', () => {
  const comparison = buildReportComparison(analytics(), analytics({ totalCteValue: 160000, totalNetValue: 64000 }));

  assert.equal(comparison.totalCteValue.percentChange, 25);
  assert.equal(comparison.totalNetValue.percentChange, 25);
});

test('marks a metric as not comparable when the reference is zero', () => {
  const comparison = buildReportComparison(analytics(), analytics({ totalCteValue: 0 }));
  assert.equal(comparison.totalCteValue.percentChange, null);
  assert.equal(comparison.totalCteValue.hasReference, false);
});

test('generates strengths, attention points and priorities from explicit evidence', () => {
  const current = analytics({ deliveredPercent: 65, expenseRatioPercent: 12 });
  const previous = analytics({ totalCteValue: 150000, totalNetValue: 70000, deliveredPercent: 85, expenseRatioPercent: 7 });
  const insights = buildReportInsights(current, previous, null);

  assert.ok(hasInsight(insights, 'strength', 'receita'));
  assert.ok(hasInsight(insights, 'attention', 'despesas'));
  assert.ok(hasInsight(insights, 'priority', 'operações'));
  assert.ok(hasInsight(insights, 'attention', 'concentração'));
});

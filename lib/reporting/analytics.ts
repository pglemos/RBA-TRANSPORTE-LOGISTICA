import { summarizePaymentIntegrity } from './reportAudit.ts';
import type {
  BreakdownItem,
  InProgressSummary,
  RankingItem,
  ReportAnalytics,
  ReportingOrder,
  ReportSummary,
  TimeSeriesPoint,
} from './types.ts';

const IN_PROGRESS_STATUSES = new Set(['Contratar', 'Carregando', 'Em Trânsito']);
const STATUS_ORDER = ['Entregue', 'Em Trânsito', 'Carregando', 'Contratar'];
const DAY_MS = 24 * 60 * 60 * 1000;

const roundCurrency = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const roundPercent = (value: number): number =>
  Math.round((value + Number.EPSILON) * 10) / 10;

const safePercent = (value: number, total: number): number =>
  total > 0 ? roundPercent((value / total) * 100) : 0;

interface MutableRanking {
  key: string;
  label: string;
  orderCount: number;
  cteValue: number;
  netValue: number;
  expenses: number;
}

function buildRanking(
  orders: ReportingOrder[],
  getKey: (order: ReportingOrder) => string,
  getLabel: (order: ReportingOrder) => string,
): RankingItem[] {
  const grouped = new Map<string, MutableRanking>();

  for (const order of orders) {
    const key = getKey(order) || 'sem-identificacao';
    const label = getLabel(order) || 'Não informado';
    const current = grouped.get(key) || {
      key,
      label,
      orderCount: 0,
      cteValue: 0,
      netValue: 0,
      expenses: 0,
    };

    current.orderCount += 1;
    current.cteValue = roundCurrency(current.cteValue + order.cteValue);
    current.netValue = roundCurrency(current.netValue + order.netValue);
    current.expenses = roundCurrency(current.expenses + order.totalExpenses);
    grouped.set(key, current);
  }

  const totalCteValue = orders.reduce((sum, order) => sum + order.cteValue, 0);

  return [...grouped.values()]
    .map((item) => ({
      ...item,
      averageCteValue: item.orderCount > 0 ? roundCurrency(item.cteValue / item.orderCount) : 0,
      sharePercent: safePercent(item.cteValue, totalCteValue),
    }))
    .sort((a, b) => b.cteValue - a.cteValue || b.orderCount - a.orderCount || a.label.localeCompare(b.label, 'pt-BR'));
}

function buildSummary(orders: ReportingOrder[]): ReportSummary {
  const totalOrders = orders.length;
  const sum = (selector: (order: ReportingOrder) => number) =>
    roundCurrency(orders.reduce((total, order) => total + selector(order), 0));

  const totalCteValue = sum((order) => order.cteValue);
  const totalNetValue = sum((order) => order.netValue);
  const totalExpenses = sum((order) => order.totalExpenses);
  const deliveredCount = orders.filter((order) => order.status === 'Entregue').length;
  const integrity = summarizePaymentIntegrity(orders);

  return {
    totalOrders,
    totalCteValue,
    totalRecordedDiscountValue: integrity.totalRecordedDiscountValue,
    totalNetRevenue: integrity.totalNetRevenue,
    totalFreightValue: sum((order) => order.freightValue),
    totalAdvanceValue: sum((order) => order.advanceValue),
    totalCashValue: sum((order) => order.cashValue),
    totalBalanceValue: sum((order) => order.balanceValue),
    totalClassifiedPaymentValue: integrity.totalClassifiedPaymentValue,
    totalUnclassifiedPaymentValue: integrity.totalUnclassifiedPaymentValue,
    unclassifiedPaymentOrderCount: integrity.unclassifiedPaymentOrderCount,
    paymentCoveragePercent: integrity.paymentCoveragePercent,
    totalExpenses,
    totalNetValue,
    averageCteValue: totalOrders > 0 ? roundCurrency(totalCteValue / totalOrders) : 0,
    averageNetValue: totalOrders > 0 ? roundCurrency(totalNetValue / totalOrders) : 0,
    marginPercent: safePercent(totalNetValue, totalCteValue),
    expenseRatioPercent: safePercent(totalExpenses, totalCteValue),
    deliveredCount,
    inTransitCount: orders.filter((order) => order.status === 'Em Trânsito').length,
    loadingCount: orders.filter((order) => order.status === 'Carregando').length,
    contractingCount: orders.filter((order) => order.status === 'Contratar').length,
    deliveredPercent: safePercent(deliveredCount, totalOrders),
  };
}

function buildStatusBreakdown(orders: ReportingOrder[]): BreakdownItem[] {
  const counts = new Map<string, number>();
  for (const order of orders) counts.set(order.status || 'Não informado', (counts.get(order.status || 'Não informado') || 0) + 1);

  return [...counts.entries()]
    .map(([label, orderCount]) => ({
      key: label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-'),
      label,
      value: orderCount,
      orderCount,
      sharePercent: safePercent(orderCount, orders.length),
    }))
    .sort((a, b) => {
      const aIndex = STATUS_ORDER.indexOf(a.label);
      const bIndex = STATUS_ORDER.indexOf(b.label);
      if (aIndex !== -1 || bIndex !== -1) return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
      return b.orderCount - a.orderCount;
    });
}

function buildExpenses(orders: ReportingOrder[]): BreakdownItem[] {
  const values = [
    { key: 'loading', label: 'Carga', selector: (order: ReportingOrder) => order.loadingExpense },
    { key: 'unloading', label: 'Descarga', selector: (order: ReportingOrder) => order.unloadingExpense },
    { key: 'other', label: 'Outros', selector: (order: ReportingOrder) => order.otherExpenses },
  ];
  const total = values.reduce(
    (grandTotal, item) => grandTotal + orders.reduce((sum, order) => sum + item.selector(order), 0),
    0,
  );

  return values.map((item) => {
    const value = roundCurrency(orders.reduce((sum, order) => sum + item.selector(order), 0));
    return {
      key: item.key,
      label: item.label,
      value,
      orderCount: orders.filter((order) => item.selector(order) > 0).length,
      sharePercent: safePercent(value, total),
    };
  });
}

function buildProfitBuckets(orders: ReportingOrder[]): BreakdownItem[] {
  const definitions = [
    { key: 'positive', label: 'Resultado positivo', predicate: (order: ReportingOrder) => order.netValue > 0 },
    { key: 'neutral', label: 'Resultado neutro', predicate: (order: ReportingOrder) => order.netValue === 0 },
    { key: 'negative', label: 'Resultado negativo', predicate: (order: ReportingOrder) => order.netValue < 0 },
  ];

  return definitions.map((definition) => {
    const selected = orders.filter(definition.predicate);
    return {
      key: definition.key,
      label: definition.label,
      value: roundCurrency(selected.reduce((sum, order) => sum + order.netValue, 0)),
      orderCount: selected.length,
      sharePercent: safePercent(selected.length, orders.length),
    };
  });
}

function mondayOfWeek(dateValue: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return 'sem-data';
  const [year, month, day] = dateValue.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - weekday + 1);
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

function formatShortDate(dateValue: string): string {
  const [year, month, day] = dateValue.split('-');
  return `${day}/${month}/${year}`;
}

function buildTimeSeries(orders: ReportingOrder[]): TimeSeriesPoint[] {
  const grouped = new Map<string, TimeSeriesPoint>();

  for (const order of orders) {
    const key = mondayOfWeek(order.emissionDateValue);
    const current = grouped.get(key) || {
      key,
      label: key === 'sem-data' ? 'Sem data' : `Semana de ${formatShortDate(key)}`,
      orderCount: 0,
      cteValue: 0,
      netValue: 0,
      expenses: 0,
    };
    current.orderCount += 1;
    current.cteValue = roundCurrency(current.cteValue + order.cteValue);
    current.netValue = roundCurrency(current.netValue + order.netValue);
    current.expenses = roundCurrency(current.expenses + order.totalExpenses);
    grouped.set(key, current);
  }

  return [...grouped.values()].sort((a, b) => {
    if (a.key === 'sem-data') return 1;
    if (b.key === 'sem-data') return -1;
    return a.key.localeCompare(b.key);
  });
}

function parseDateOnly(value: string | Date): number | null {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) : null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = Date.UTC(year, month - 1, day);
  return Number.isFinite(date) ? date : null;
}

function daysOpen(order: ReportingOrder, referenceDate: string | Date): number {
  const start = parseDateOnly(order.emissionDateValue);
  const end = parseDateOnly(referenceDate);
  if (start === null || end === null || end < start) return 0;
  return Math.floor((end - start) / DAY_MS);
}

function recurringCount(ranking: RankingItem[]): number {
  return ranking.filter((item) => item.orderCount >= 2).length;
}

function recurringOrderPercent(ranking: RankingItem[], totalOrders: number): number {
  const recurringOrders = ranking
    .filter((item) => item.orderCount >= 2)
    .reduce((sum, item) => sum + item.orderCount, 0);
  return safePercent(recurringOrders, totalOrders);
}

function buildInProgressSummary(
  inProgress: ReportingOrder[],
  referenceDate: string | Date,
): InProgressSummary {
  const ages = inProgress.map((order) => daysOpen(order, referenceDate));
  return {
    totalOrders: inProgress.length,
    totalCteValue: roundCurrency(inProgress.reduce((sum, order) => sum + order.cteValue, 0)),
    totalNetValue: roundCurrency(inProgress.reduce((sum, order) => sum + order.netValue, 0)),
    averageOpenDays: ages.length > 0 ? Math.round(ages.reduce((sum, value) => sum + value, 0) / ages.length) : 0,
    oldestOpenDays: ages.length > 0 ? Math.max(...ages) : 0,
    byStatus: buildStatusBreakdown(inProgress),
    byClient: buildRanking(inProgress, (order) => order.clientId || order.clientName, (order) => order.clientName),
    byRoute: buildRanking(
      inProgress,
      (order) => `${order.origin || 'Sem origem'}::${order.destination || 'Sem destino'}`,
      (order) => `${order.origin || 'Sem origem'} → ${order.destination || 'Sem destino'}`,
    ),
  };
}

export function buildReportAnalytics(
  orders: ReportingOrder[],
  referenceDate: string | Date = new Date(),
): ReportAnalytics {
  const clients = buildRanking(orders, (order) => order.clientId || order.clientName, (order) => order.clientName);
  const drivers = buildRanking(orders, (order) => order.driverId || order.driverName, (order) => order.driverName);
  const routes = buildRanking(
    orders,
    (order) => `${order.origin || 'Sem origem'}::${order.destination || 'Sem destino'}`,
    (order) => `${order.origin || 'Sem origem'} → ${order.destination || 'Sem destino'}`,
  );
  const clientRoutes = buildRanking(
    orders,
    (order) => `${order.clientId || order.clientName}::${order.origin || 'Sem origem'}::${order.destination || 'Sem destino'}`,
    (order) => `${order.clientName} · ${order.origin || 'Sem origem'} → ${order.destination || 'Sem destino'}`,
  );
  const origins = buildRanking(orders, (order) => order.origin || 'Sem origem', (order) => order.origin || 'Sem origem');
  const destinations = buildRanking(orders, (order) => order.destination || 'Sem destino', (order) => order.destination || 'Sem destino');
  const inProgress = orders.filter((order) => IN_PROGRESS_STATUSES.has(order.status));

  return {
    summary: buildSummary(orders),
    clients,
    drivers,
    routes,
    clientRoutes,
    origins,
    destinations,
    statuses: buildStatusBreakdown(orders),
    expenses: buildExpenses(orders),
    profitBuckets: buildProfitBuckets(orders),
    timeSeries: buildTimeSeries(orders),
    inProgress,
    inProgressSummary: buildInProgressSummary(inProgress, referenceDate),
    recurrence: {
      clients: recurringCount(clients),
      drivers: recurringCount(drivers),
      routes: recurringCount(routes),
      clientRoutes: recurringCount(clientRoutes),
      recurringClientOrderPercent: recurringOrderPercent(clients, orders.length),
      recurringDriverOrderPercent: recurringOrderPercent(drivers, orders.length),
      recurringRouteOrderPercent: recurringOrderPercent(routes, orders.length),
      recurringClientRouteOrderPercent: recurringOrderPercent(clientRoutes, orders.length),
      leadingClientDependencyPercent: clients[0]?.sharePercent || 0,
    },
  };
}

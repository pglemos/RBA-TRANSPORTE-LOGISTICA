import type { ReportingOrder } from './types.ts';

export interface ReportOrderSource extends Record<string, unknown> {
  id?: unknown;
  order_number?: unknown;
  cte_number?: unknown;
  client_id?: unknown;
  client_name?: unknown;
  driver_id?: unknown;
  driver_name?: unknown;
  origin?: unknown;
  destination?: unknown;
  status?: unknown;
  cte_value?: unknown;
  freight_value?: unknown;
  advance_value?: unknown;
  cash_value?: unknown;
  balance_value?: unknown;
  loading_expense?: unknown;
  unloading_expense?: unknown;
  other_expenses?: unknown;
  total_expenses?: unknown;
  net_value?: unknown;
}

export interface ReportingOrderAdapterOptions {
  normalizeStatus: (status: unknown) => string;
  formatEmissionDate: (order: ReportOrderSource) => string;
  getEmissionDateValue: (order: ReportOrderSource) => string;
}

export interface ReportingOrderTextFilters {
  origin?: string;
  destination?: string;
  search?: string;
}

const toText = (value: unknown, fallback = ''): string => {
  if (value === undefined || value === null) return fallback;
  const text = String(value).trim();
  return text || fallback;
};

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value !== 'string') return 0;
  const raw = value.trim();
  if (!raw) return 0;
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeSearch = (value: string): string =>
  value.trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function buildReportingOrders(
  orders: ReportOrderSource[],
  options: ReportingOrderAdapterOptions,
): ReportingOrder[] {
  return orders.map((order) => ({
    id: toText(order.id),
    orderNumber: toText(order.order_number),
    cteNumber: toText(order.cte_number, 'A emitir'),
    emissionDate: toText(options.formatEmissionDate(order), 'N/A'),
    emissionDateValue: toText(options.getEmissionDateValue(order)),
    clientId: toText(order.client_id),
    clientName: toText(order.client_name, 'Não informado'),
    driverId: toText(order.driver_id),
    driverName: toText(order.driver_name, 'Não informado'),
    origin: toText(order.origin, 'Não informado'),
    destination: toText(order.destination, 'Não informado'),
    status: toText(options.normalizeStatus(order.status), 'Contratar'),
    cteValue: toNumber(order.cte_value),
    freightValue: toNumber(order.freight_value),
    advanceValue: toNumber(order.advance_value),
    cashValue: toNumber(order.cash_value),
    balanceValue: toNumber(order.balance_value),
    loadingExpense: toNumber(order.loading_expense),
    unloadingExpense: toNumber(order.unloading_expense),
    otherExpenses: toNumber(order.other_expenses),
    totalExpenses: toNumber(order.total_expenses),
    netValue: toNumber(order.net_value),
  }));
}

export function filterReportingOrders(
  orders: ReportingOrder[],
  filters: ReportingOrderTextFilters,
): ReportingOrder[] {
  const origin = normalizeSearch(filters.origin || '');
  const destination = normalizeSearch(filters.destination || '');
  const search = normalizeSearch(filters.search || '');

  if (!origin && !destination && !search) return orders;

  return orders.filter((order) => {
    const normalizedOrigin = normalizeSearch(order.origin);
    const normalizedDestination = normalizeSearch(order.destination);
    if (origin && !normalizedOrigin.includes(origin)) return false;
    if (destination && !normalizedDestination.includes(destination)) return false;

    if (search) {
      const haystack = normalizeSearch([
        order.orderNumber,
        order.cteNumber,
        order.clientName,
        order.driverName,
        order.origin,
        order.destination,
        order.status,
      ].join(' '));
      if (!haystack.includes(search)) return false;
    }

    return true;
  });
}

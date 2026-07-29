export interface ReportOrderInput extends Record<string, unknown> {
  id?: unknown;
  order_number?: unknown;
  cte_number?: unknown;
  driver_name?: unknown;
  driver_cpf?: unknown;
  vehicle_tractor_plate?: unknown;
  vehicle_trailer_plate?: unknown;
  origin?: unknown;
  destination?: unknown;
  client_name?: unknown;
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
  status?: unknown;
}

export interface ReportRow {
  id: string;
  orderNumber: string;
  cteNumber: string;
  emissionDate: string;
  driverName: string;
  driverCpf: string;
  tractorPlate: string;
  trailerPlate: string;
  origin: string;
  destination: string;
  clientName: string;
  cteValue: number;
  freightValue: number;
  advanceValue: number;
  cashValue: number;
  balanceValue: number;
  loadingExpense: number;
  unloadingExpense: number;
  otherExpenses: number;
  totalExpenses: number;
  netValue: number;
  status: string;
}

export interface ReportSummary {
  totalOrders: number;
  totalCteValue: number;
  totalFreightValue: number;
  totalAdvanceValue: number;
  totalCashValue: number;
  totalBalanceValue: number;
  totalExpenses: number;
  totalNetValue: number;
  averageCteValue: number;
  deliveredCount: number;
  inTransitCount: number;
  loadingCount: number;
  contractingCount: number;
  deliveredPercent: number;
}

export interface ReportBuildOptions {
  normalizeStatus?: (status: unknown) => string;
  formatEmissionDate?: (order: ReportOrderInput) => string;
}

const CSV_HEADERS = [
  'Ordem Nº',
  'CTE / Manifesto',
  'Data de Emissão',
  'Motorista',
  'CPF Motorista',
  'Placa Cavalo',
  'Placa Carreta',
  'Origem',
  'Destino',
  'Cliente Tomador',
  'Valor CTE (R$)',
  'Frete Motorista (R$)',
  'Adiantamento (R$)',
  'Saldo à Vista (R$)',
  'Saldo a Pagar (R$)',
  'Carga (R$)',
  'Descarga (R$)',
  'Outros (R$)',
  'Despesas Totais (R$)',
  'Lucro Líquido Registrado (R$)',
  'Status Operacional',
] as const;

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

  const normalized = raw.includes(',')
    ? raw.replace(/\./g, '').replace(',', '.')
    : raw;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundCurrency = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const sumField = (rows: ReportRow[], selector: (row: ReportRow) => number): number =>
  roundCurrency(rows.reduce((total, row) => total + selector(row), 0));

export function buildReportRows(
  orders: ReportOrderInput[],
  options: ReportBuildOptions = {},
): ReportRow[] {
  const normalizeStatus = options.normalizeStatus || ((status: unknown) => toText(status, 'Contratar'));
  const formatEmissionDate = options.formatEmissionDate || (() => 'N/A');

  return orders.map((order) => ({
    id: toText(order.id),
    orderNumber: toText(order.order_number),
    cteNumber: toText(order.cte_number, 'A emitir'),
    emissionDate: toText(formatEmissionDate(order), 'N/A'),
    driverName: toText(order.driver_name, 'N/A'),
    driverCpf: toText(order.driver_cpf, 'N/A'),
    tractorPlate: toText(order.vehicle_tractor_plate, 'N/A'),
    trailerPlate: toText(order.vehicle_trailer_plate, 'N/A'),
    origin: toText(order.origin),
    destination: toText(order.destination),
    clientName: toText(order.client_name, 'N/A'),
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
    status: toText(normalizeStatus(order.status), 'Contratar'),
  }));
}

export function buildReportSummary(rows: ReportRow[]): ReportSummary {
  const totalOrders = rows.length;
  const deliveredCount = rows.filter((row) => row.status === 'Entregue').length;
  const totalCteValue = sumField(rows, (row) => row.cteValue);

  return {
    totalOrders,
    totalCteValue,
    totalFreightValue: sumField(rows, (row) => row.freightValue),
    totalAdvanceValue: sumField(rows, (row) => row.advanceValue),
    totalCashValue: sumField(rows, (row) => row.cashValue),
    totalBalanceValue: sumField(rows, (row) => row.balanceValue),
    totalExpenses: sumField(rows, (row) => row.totalExpenses),
    totalNetValue: sumField(rows, (row) => row.netValue),
    averageCteValue: totalOrders > 0 ? roundCurrency(totalCteValue / totalOrders) : 0,
    deliveredCount,
    inTransitCount: rows.filter((row) => row.status === 'Em Trânsito').length,
    loadingCount: rows.filter((row) => row.status === 'Carregando').length,
    contractingCount: rows.filter((row) => row.status === 'Contratar').length,
    deliveredPercent: totalOrders > 0 ? Math.round((deliveredCount / totalOrders) * 1000) / 10 : 0,
  };
}

export function neutralizeSpreadsheetFormula(value: string): string {
  const firstNonWhitespace = value.trimStart().charAt(0);
  return ['=', '+', '-', '@'].includes(firstNonWhitespace) ? `'${value}` : value;
}

const escapeCsvText = (value: string): string =>
  `"${neutralizeSpreadsheetFormula(value).replace(/"/g, '""')}"`;

const formatCsvCurrency = (value: number): string =>
  roundCurrency(value).toFixed(2).replace('.', ',');

export function serializeReportCsv(rows: ReportRow[]): string {
  const header = CSV_HEADERS.map(escapeCsvText).join(';');
  const records = rows.map((row) => [
    escapeCsvText(row.orderNumber),
    escapeCsvText(row.cteNumber),
    escapeCsvText(row.emissionDate),
    escapeCsvText(row.driverName),
    escapeCsvText(row.driverCpf),
    escapeCsvText(row.tractorPlate),
    escapeCsvText(row.trailerPlate),
    escapeCsvText(row.origin),
    escapeCsvText(row.destination),
    escapeCsvText(row.clientName),
    formatCsvCurrency(row.cteValue),
    formatCsvCurrency(row.freightValue),
    formatCsvCurrency(row.advanceValue),
    formatCsvCurrency(row.cashValue),
    formatCsvCurrency(row.balanceValue),
    formatCsvCurrency(row.loadingExpense),
    formatCsvCurrency(row.unloadingExpense),
    formatCsvCurrency(row.otherExpenses),
    formatCsvCurrency(row.totalExpenses),
    formatCsvCurrency(row.netValue),
    escapeCsvText(row.status),
  ].join(';'));

  return `\uFEFF${[header, ...records].join('\r\n')}`;
}

export function buildReportFileName(extension: 'csv' | 'pdf', date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `relatorio-executivo-rba-${year}-${month}-${day}.${extension}`;
}
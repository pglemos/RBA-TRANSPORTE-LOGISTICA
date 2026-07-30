
import type { RankingItem, ReportAnalytics, ReportKind, ReportingOrder } from './types.ts';

const BOM = '\uFEFF';
const CRLF = '\r\n';
const SCHEMA_VERSION = 'rba-report-v2';

const roundCurrency = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export function neutralizeSpreadsheetFormula(value: string): string {
  const firstNonWhitespace = value.trimStart().charAt(0);
  return ['=', '+', '-', '@'].includes(firstNonWhitespace) ? `'${value}` : value;
}

const escapeText = (value: unknown): string => {
  const text = value === undefined || value === null ? '' : String(value);
  return `"${neutralizeSpreadsheetFormula(text).replace(/"/g, '""')}"`;
};

const formatNumber = (value: number): string => roundCurrency(value).toFixed(2).replace('.', ',');
const formatPercent = (value: number): string => roundCurrency(value).toFixed(1).replace('.', ',');

function buildCsv(headers: string[], rows: Array<Array<string | number>>): string {
  const header = headers.map(escapeText).join(';');
  const records = rows.map((row) => row.map((value) => typeof value === 'number' ? formatNumber(value) : escapeText(value)).join(';'));
  return `${BOM}${[header, ...records].join(CRLF)}${CRLF}`;
}

function rankingRows(items: RankingItem[]): Array<Array<string | number>> {
  return items.map((item) => [item.label, item.orderCount, item.cteValue, item.netValue, item.expenses, item.averageCteValue, `${formatPercent(item.sharePercent)}%`]);
}

function detailedRows(orders: ReportingOrder[]): Array<Array<string | number>> {
  return orders.map((order) => [
    order.orderNumber,
    order.cteNumber,
    order.emissionDate,
    order.emissionDateValue,
    order.driverName,
    order.clientName,
    order.origin,
    order.destination,
    order.cteValue,
    order.cteDiscountPercent,
    order.cteDiscountValue,
    order.netRevenue,
    order.freightValue,
    order.advanceValue,
    order.cashValue,
    order.balanceValue,
    order.classifiedPaymentValue,
    order.unclassifiedPaymentValue,
    order.loadingExpense,
    order.unloadingExpense,
    order.otherExpenses,
    order.totalExpenses,
    order.netValue,
    order.status,
    SCHEMA_VERSION,
  ]);
}

export function serializeReportModelCsv(kind: ReportKind, orders: ReportingOrder[], analytics: ReportAnalytics): string {
  if (kind === 'expenses') {
    return buildCsv(['Categoria de Despesa', 'Valor Registrado (R$)', 'Operações com Lançamento', 'Participação (%)'], analytics.expenses.map((item) => [item.label, item.value, item.orderCount, `${formatPercent(item.sharePercent)}%`]));
  }
  if (kind === 'clients') return buildCsv(['Cliente', 'Operações', 'Valor CTE (R$)', 'Lucro Registrado (R$)', 'Despesas (R$)', 'Ticket Médio (R$)', 'Participação no CTE (%)'], rankingRows(analytics.clients));
  if (kind === 'drivers') return buildCsv(['Motorista', 'Operações', 'Valor CTE (R$)', 'Lucro Registrado (R$)', 'Despesas (R$)', 'Ticket Médio (R$)', 'Participação no CTE (%)'], rankingRows(analytics.drivers));
  if (kind === 'routes') return buildCsv(['Rota', 'Operações', 'Valor CTE (R$)', 'Lucro Registrado (R$)', 'Despesas (R$)', 'Ticket Médio (R$)', 'Participação no CTE (%)'], rankingRows(analytics.routes));
  if (kind === 'recurrence') {
    const rows: Array<Array<string | number>> = [];
    for (const item of analytics.clients.filter((entry) => entry.orderCount >= 2)) rows.push(['Cliente', ...rankingRows([item])[0]]);
    for (const item of analytics.drivers.filter((entry) => entry.orderCount >= 2)) rows.push(['Motorista', ...rankingRows([item])[0]]);
    for (const item of analytics.routes.filter((entry) => entry.orderCount >= 2)) rows.push(['Rota', ...rankingRows([item])[0]]);
    return buildCsv(['Tipo', 'Nome', 'Operações', 'Valor CTE (R$)', 'Lucro Registrado (R$)', 'Despesas (R$)', 'Ticket Médio (R$)', 'Participação no CTE (%)'], rows);
  }
  const selectedOrders = kind === 'in-progress' ? analytics.inProgress : orders;
  return buildCsv(
    ['Ordem Nº', 'Referências CTE / Manifesto', 'Data de Emissão', 'Data ISO', 'Motorista', 'Cliente Tomador', 'Origem', 'Destino', 'Valor CTE (R$)', 'Desconto CTE (%)', 'Dedução CTE Registrada (R$)', 'Receita Líquida Registrada (R$)', 'Frete Motorista (R$)', 'Adiantamento (R$)', 'À Vista (R$)', 'Saldo a Pagar (R$)', 'Pagamento Classificado (R$)', 'Pagamento Não Classificado (R$)', 'Carga (R$)', 'Descarga (R$)', 'Outros (R$)', 'Despesas Totais (R$)', 'Lucro Líquido Registrado (R$)', 'Status Operacional', 'Versão do Schema'],
    detailedRows(selectedOrders),
  );
}

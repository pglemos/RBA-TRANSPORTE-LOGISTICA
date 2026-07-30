import ExcelJS from 'exceljs';

import { buildReportComparison } from './insights.ts';
import type {
  BreakdownItem,
  RankingItem,
  ReportAnalytics,
  ReportInsight,
  ReportKind,
  ReportingOrder,
  TimeSeriesPoint,
} from './types.ts';

const COLORS = {
  navy: '0B1730',
  navySoft: '17243E',
  gold: 'C5A866',
  goldSoft: 'F5EEDD',
  white: 'FFFFFF',
  text: '172033',
  muted: '667085',
  border: 'D8DEE8',
  stripe: 'F8FAFC',
  green: '17603A',
  greenSoft: 'EDF8F1',
  amberSoft: 'FFF7E6',
  blueSoft: 'EDF4FF',
} as const;

const CURRENCY_FORMAT = 'R$ #,##0.00;[Red]-R$ #,##0.00';
const PERCENT_FORMAT = '0.0%';

const MODEL_LABELS: Record<ReportKind, string> = {
  executive: 'Executivo',
  expenses: 'Despesas',
  profits: 'Lucros',
  clients: 'Clientes',
  drivers: 'Motoristas',
  routes: 'Rotas',
  recurrence: 'Recorrência',
  'in-progress': 'Em Andamento',
};

export interface ReportWorkbookInput {
  kind: ReportKind;
  periodLabel: string;
  filtersLabel: string;
  orders: ReportingOrder[];
  current: ReportAnalytics;
  previous: ReportAnalytics | null;
  previousYear: ReportAnalytics | null;
  insights: ReportInsight[];
}

interface TableOptions {
  freeze?: boolean;
  autoFilter?: boolean;
  currencyColumns?: number[];
  percentColumns?: number[];
  integerColumns?: number[];
}

function fill(color: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
}

function styleHeader(row: ExcelJS.Row) {
  row.height = 30;
  row.eachCell((cell) => {
    cell.fill = fill(COLORS.navy);
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: COLORS.white } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: COLORS.navy } },
      bottom: { style: 'medium', color: { argb: COLORS.gold } },
      left: { style: 'thin', color: { argb: COLORS.navySoft } },
      right: { style: 'thin', color: { argb: COLORS.navySoft } },
    };
  });
}

function styleBody(sheet: ExcelJS.Worksheet, startRow: number, endRow: number) {
  for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    row.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 9, color: { argb: COLORS.text } };
      cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
      cell.border = { bottom: { style: 'hair', color: { argb: COLORS.border } } };
      if (rowNumber % 2 === 0) cell.fill = fill(COLORS.stripe);
    });
  }
}

function autoFit(sheet: ExcelJS.Worksheet, minimum = 11, maximum = 42) {
  sheet.columns.forEach((column) => {
    let width = minimum;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const raw = cell.value;
      const text = raw === null || raw === undefined ? '' : String(raw);
      const longest = text.split(/\r?\n/).reduce((value, line) => Math.max(value, line.length), 0);
      width = Math.max(width, Math.min(maximum, longest + 2));
    });
    column.width = width;
  });
}

function addBrand(sheet: ExcelJS.Worksheet, title: string, input: ReportWorkbookInput) {
  sheet.mergeCells('A1:H1');
  const brand = sheet.getCell('A1');
  brand.value = 'RBA TRANSPORTE & LOGÍSTICA';
  brand.fill = fill(COLORS.navy);
  brand.font = { name: 'Arial', size: 16, bold: true, color: { argb: COLORS.white } };
  brand.alignment = { vertical: 'middle', horizontal: 'left' };
  sheet.getRow(1).height = 32;

  sheet.mergeCells('A2:H2');
  const titleCell = sheet.getCell('A2');
  titleCell.value = title;
  titleCell.font = { name: 'Arial', size: 15, bold: true, color: { argb: COLORS.navy } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  sheet.getRow(2).height = 30;

  sheet.mergeCells('A3:H3');
  sheet.getCell('A3').value = `Período: ${input.periodLabel}`;
  sheet.getCell('A3').font = { name: 'Arial', size: 10, bold: true, color: { argb: COLORS.gold } };

  sheet.mergeCells('A4:H4');
  sheet.getCell('A4').value = `Filtros: ${input.filtersLabel}`;
  sheet.getCell('A4').font = { name: 'Arial', size: 9, color: { argb: COLORS.muted } };
  sheet.getCell('A4').alignment = { wrapText: true };
  sheet.getRow(4).height = 30;
}

function addSection(sheet: ExcelJS.Worksheet, title: string, columns = 8) {
  sheet.addRow([]);
  const row = sheet.addRow([title]);
  sheet.mergeCells(row.number, 1, row.number, columns);
  row.height = 24;
  const cell = row.getCell(1);
  cell.fill = fill(COLORS.goldSoft);
  cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: COLORS.navy } };
  cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  cell.border = { left: { style: 'medium', color: { argb: COLORS.gold } } };
}

function addTable(
  sheet: ExcelJS.Worksheet,
  headers: string[],
  rows: Array<Array<string | number>>,
  options: TableOptions = {},
): number {
  const header = sheet.addRow(headers);
  styleHeader(header);
  const start = header.number + 1;
  rows.forEach((row) => sheet.addRow(row));
  const end = sheet.lastRow?.number || start - 1;
  styleBody(sheet, start, end);

  for (let rowNumber = start; rowNumber <= end; rowNumber += 1) {
    options.currencyColumns?.forEach((column) => { sheet.getCell(rowNumber, column).numFmt = CURRENCY_FORMAT; });
    options.percentColumns?.forEach((column) => { sheet.getCell(rowNumber, column).numFmt = PERCENT_FORMAT; });
    options.integerColumns?.forEach((column) => { sheet.getCell(rowNumber, column).numFmt = '0'; });
  }

  if (options.freeze) sheet.views = [{ state: 'frozen', ySplit: header.number }];
  if (options.autoFilter) {
    sheet.autoFilter = {
      from: { row: header.number, column: 1 },
      to: { row: header.number, column: headers.length },
    };
  }
  return header.number;
}

function rankingRows(items: RankingItem[]) {
  return items.map((item) => [
    item.label,
    item.orderCount,
    item.cteValue,
    item.averageCteValue,
    item.expenses,
    item.netValue,
    item.sharePercent / 100,
  ]);
}

function addRanking(sheet: ExcelJS.Worksheet, title: string, items: RankingItem[]) {
  addSection(sheet, title, 7);
  addTable(
    sheet,
    ['Nome', 'Operações', 'Valor CTE', 'Ticket médio', 'Despesas', 'Lucro líquido', 'Participação'],
    rankingRows(items),
    { integerColumns: [2], currencyColumns: [3, 4, 5, 6], percentColumns: [7] },
  );
}

function addBreakdown(sheet: ExcelJS.Worksheet, title: string, items: BreakdownItem[], mode: 'currency' | 'count' = 'currency') {
  addSection(sheet, title, 4);
  addTable(
    sheet,
    ['Categoria', 'Valor', 'Operações', 'Participação'],
    items.map((item) => [item.label, mode === 'currency' ? item.value : item.orderCount, item.orderCount, item.sharePercent / 100]),
    { currencyColumns: mode === 'currency' ? [2] : [], integerColumns: mode === 'count' ? [2, 3] : [3], percentColumns: [4] },
  );
}

function addTimeSeries(sheet: ExcelJS.Worksheet, title: string, points: TimeSeriesPoint[]) {
  addSection(sheet, title, 5);
  addTable(
    sheet,
    ['Semana', 'Operações', 'Valor CTE', 'Despesas', 'Lucro líquido'],
    points.map((point) => [point.label, point.orderCount, point.cteValue, point.expenses, point.netValue]),
    { integerColumns: [2], currencyColumns: [3, 4, 5] },
  );
}

function orderRows(orders: ReportingOrder[]) {
  return orders.map((order) => [
    order.orderNumber,
    order.cteNumber,
    order.emissionDate,
    order.clientName,
    order.driverName,
    order.origin,
    order.destination,
    order.cteValue,
    order.freightValue,
    order.advanceValue,
    order.cashValue,
    order.balanceValue,
    order.loadingExpense,
    order.unloadingExpense,
    order.otherExpenses,
    order.totalExpenses,
    order.netValue,
    order.status,
  ]);
}

function addMetricGrid(sheet: ExcelJS.Worksheet, analytics: ReportAnalytics) {
  addSection(sheet, 'Indicadores do período', 8);
  const rows = [
    ['Operações', analytics.summary.totalOrders, 'Valor CTE', analytics.summary.totalCteValue, 'Frete', analytics.summary.totalFreightValue, 'Despesas', analytics.summary.totalExpenses],
    ['Lucro líquido', analytics.summary.totalNetValue, 'Margem', analytics.summary.marginPercent / 100, 'Ticket médio', analytics.summary.averageCteValue, 'Entregues', analytics.summary.deliveredPercent / 100],
  ];
  rows.forEach((values, index) => {
    const row = sheet.addRow(values);
    row.height = 34;
    row.eachCell((cell, columnNumber) => {
      cell.fill = fill(columnNumber % 2 === 0 ? COLORS.goldSoft : COLORS.stripe);
      cell.font = columnNumber % 2 === 0
        ? { name: 'Arial', size: 11, bold: true, color: { argb: COLORS.navy } }
        : { name: 'Arial', size: 8, bold: true, color: { argb: COLORS.muted } };
      cell.alignment = { vertical: 'middle', horizontal: columnNumber % 2 === 0 ? 'right' : 'left', wrapText: true };
    });
    if (index === 0) {
      row.getCell(2).numFmt = '0';
      [4, 6, 8].forEach((column) => { row.getCell(column).numFmt = CURRENCY_FORMAT; });
    } else {
      row.getCell(2).numFmt = CURRENCY_FORMAT;
      row.getCell(4).numFmt = PERCENT_FORMAT;
      row.getCell(6).numFmt = CURRENCY_FORMAT;
      row.getCell(8).numFmt = PERCENT_FORMAT;
    }
  });
}

function addExecutiveSheet(sheet: ExcelJS.Worksheet, input: ReportWorkbookInput) {
  addBrand(sheet, 'Resumo Executivo do Período', input);
  addMetricGrid(sheet, input.current);
  addRanking(sheet, 'Principais clientes', input.current.clients.slice(0, 10));
  addRanking(sheet, 'Principais rotas', input.current.routes.slice(0, 10));
  addTimeSeries(sheet, 'Evolução semanal', input.current.timeSeries);
  sheet.views = [{ state: 'frozen', ySplit: 4 }];
  autoFit(sheet, 12, 38);
}

function addModelSheet(sheet: ExcelJS.Worksheet, input: ReportWorkbookInput) {
  addBrand(sheet, `Relatório de ${MODEL_LABELS[input.kind]}`, input);
  const limit = 30;
  const byExpense = (items: RankingItem[]) => [...items].sort((a, b) => b.expenses - a.expenses).slice(0, limit);
  const byProfit = (items: RankingItem[]) => [...items].sort((a, b) => b.netValue - a.netValue).slice(0, limit);
  const recurring = (items: RankingItem[]) => items.filter((item) => item.orderCount >= 2).slice(0, limit);

  if (input.kind === 'expenses') {
    addBreakdown(sheet, 'Composição das despesas', input.current.expenses);
    addRanking(sheet, 'Clientes com maior despesa', byExpense(input.current.clients));
    addRanking(sheet, 'Motoristas com maior despesa', byExpense(input.current.drivers));
    addRanking(sheet, 'Rotas com maior despesa', byExpense(input.current.routes));
    addTimeSeries(sheet, 'Evolução semanal das despesas', input.current.timeSeries);
  } else if (input.kind === 'profits') {
    addBreakdown(sheet, 'Distribuição dos resultados registrados', input.current.profitBuckets);
    addRanking(sheet, 'Clientes com maior lucro', byProfit(input.current.clients));
    addRanking(sheet, 'Motoristas com maior lucro', byProfit(input.current.drivers));
    addRanking(sheet, 'Rotas com maior lucro', byProfit(input.current.routes));
    addTimeSeries(sheet, 'Evolução semanal do lucro', input.current.timeSeries);
  } else if (input.kind === 'clients') {
    addMetricGrid(sheet, input.current);
    addRanking(sheet, 'Performance por cliente', input.current.clients.slice(0, limit));
    addRanking(sheet, 'Clientes recorrentes', recurring(input.current.clients));
  } else if (input.kind === 'drivers') {
    addMetricGrid(sheet, input.current);
    addRanking(sheet, 'Performance por motorista', input.current.drivers.slice(0, limit));
    addRanking(sheet, 'Motoristas recorrentes', recurring(input.current.drivers));
  } else if (input.kind === 'routes') {
    addRanking(sheet, 'Performance por rota', input.current.routes.slice(0, limit));
    addRanking(sheet, 'Principais origens', input.current.origins.slice(0, limit));
    addRanking(sheet, 'Principais destinos', input.current.destinations.slice(0, limit));
    addTimeSeries(sheet, 'Evolução semanal das rotas', input.current.timeSeries);
  } else if (input.kind === 'recurrence') {
    addRanking(sheet, 'Clientes recorrentes', recurring(input.current.clients));
    addRanking(sheet, 'Motoristas recorrentes', recurring(input.current.drivers));
    addRanking(sheet, 'Rotas recorrentes', recurring(input.current.routes));
    addRanking(sheet, 'Combinações cliente + rota', recurring(input.current.clientRoutes));
  } else if (input.kind === 'in-progress') {
    addBreakdown(sheet, 'Operações abertas por status', input.current.inProgressSummary.byStatus, 'count');
    addRanking(sheet, 'Clientes com operações abertas', input.current.inProgressSummary.byClient.slice(0, limit));
    addRanking(sheet, 'Rotas com operações abertas', input.current.inProgressSummary.byRoute.slice(0, limit));
    addSection(sheet, 'Detalhamento das operações em andamento', 12);
    addTable(
      sheet,
      ['Ordem', 'CTE / Manifesto', 'Emissão', 'Cliente', 'Motorista', 'Origem', 'Destino', 'Valor CTE', 'Frete', 'Despesas', 'Lucro', 'Status'],
      input.current.inProgress.map((order) => [order.orderNumber, order.cteNumber, order.emissionDate, order.clientName, order.driverName, order.origin, order.destination, order.cteValue, order.freightValue, order.totalExpenses, order.netValue, order.status]),
      { currencyColumns: [8, 9, 10, 11], freeze: true, autoFilter: true },
    );
  } else {
    addMetricGrid(sheet, input.current);
    addRanking(sheet, 'Principais clientes', input.current.clients.slice(0, limit));
    addRanking(sheet, 'Principais rotas', input.current.routes.slice(0, limit));
    addTimeSeries(sheet, 'Evolução semanal', input.current.timeSeries);
  }

  if (input.kind !== 'in-progress') sheet.views = [{ state: 'frozen', ySplit: 4 }];
  autoFit(sheet, 12, 42);
}

function addComparisonSheet(sheet: ExcelJS.Worksheet, input: ReportWorkbookInput) {
  addBrand(sheet, 'Comparações Gerenciais', input);
  const previous = input.previous ? buildReportComparison(input.current, input.previous) : null;
  const previousYear = input.previousYear ? buildReportComparison(input.current, input.previousYear) : null;
  const definitions: Array<[string, keyof ReturnType<typeof buildReportComparison>, 'currency' | 'integer' | 'percent']> = [
    ['Operações', 'totalOrders', 'integer'],
    ['Valor CTE', 'totalCteValue', 'currency'],
    ['Lucro líquido registrado', 'totalNetValue', 'currency'],
    ['Despesas registradas', 'totalExpenses', 'currency'],
    ['Margem gerencial', 'marginPercent', 'percent'],
    ['Operações entregues', 'deliveredPercent', 'percent'],
  ];
  addTable(
    sheet,
    ['Indicador', 'Atual', 'Período anterior', 'Variação', 'Ano anterior', 'Variação anual'],
    definitions.map(([label, key, type]) => {
      const currentRaw = input.current.summary[key as keyof typeof input.current.summary] as number;
      const previousMetric = previous?.[key];
      const yearMetric = previousYear?.[key];
      const convert = (value: number) => type === 'percent' ? value / 100 : value;
      return [
        label,
        convert(currentRaw),
        previousMetric ? convert(previousMetric.reference) : 'Sem base',
        previousMetric?.percentChange === null || !previousMetric ? 'Sem base' : previousMetric.percentChange / 100,
        yearMetric ? convert(yearMetric.reference) : 'Sem base',
        yearMetric?.percentChange === null || !yearMetric ? 'Sem base' : yearMetric.percentChange / 100,
      ];
    }),
  );
  const start = 6;
  definitions.forEach(([, , type], index) => {
    const row = start + index;
    if (type === 'currency') [2, 3, 5].forEach((column) => { if (typeof sheet.getCell(row, column).value === 'number') sheet.getCell(row, column).numFmt = CURRENCY_FORMAT; });
    if (type === 'percent') [2, 3, 5].forEach((column) => { if (typeof sheet.getCell(row, column).value === 'number') sheet.getCell(row, column).numFmt = PERCENT_FORMAT; });
    [4, 6].forEach((column) => { if (typeof sheet.getCell(row, column).value === 'number') sheet.getCell(row, column).numFmt = PERCENT_FORMAT; });
  });
  sheet.views = [{ state: 'frozen', ySplit: 5 }];
  autoFit(sheet, 14, 34);
}

function addInsightsSheet(sheet: ExcelJS.Worksheet, input: ReportWorkbookInput) {
  addBrand(sheet, 'Insights e Prioridades', input);
  addTable(
    sheet,
    ['Classificação', 'Título', 'Descrição', 'Evidência', 'Prioridade'],
    input.insights.map((insight) => [insight.kind, insight.title, insight.description, insight.evidence, insight.priority]),
    { integerColumns: [5], freeze: true, autoFilter: true },
  );
  const start = 6;
  for (let row = start; row <= (sheet.lastRow?.number || start - 1); row += 1) {
    const kind = String(sheet.getCell(row, 1).value || '');
    sheet.getCell(row, 1).fill = fill(kind === 'strength' || kind === 'highlight' ? COLORS.greenSoft : kind === 'priority' || kind === 'attention' ? COLORS.amberSoft : COLORS.blueSoft);
    sheet.getCell(row, 1).font = { name: 'Arial', size: 9, bold: true, color: { argb: COLORS.navy } };
  }
  autoFit(sheet, 12, 58);
}

function addBaseSheet(sheet: ExcelJS.Worksheet, orders: ReportingOrder[]) {
  addTable(
    sheet,
    ['Ordem', 'CTE / Manifesto', 'Emissão', 'Cliente', 'Motorista', 'Origem', 'Destino', 'Valor CTE', 'Frete', 'Adiantamento', 'À vista', 'Saldo', 'Carga', 'Descarga', 'Outros', 'Despesas totais', 'Lucro líquido', 'Status'],
    orderRows(orders),
    { currencyColumns: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17], freeze: true, autoFilter: true },
  );
  autoFit(sheet, 11, 38);
}

export function buildReportWorkbook(input: ReportWorkbookInput): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'RBA Transporte & Logística';
  workbook.company = 'RBA Transporte & Logística';
  workbook.title = `Relatório de ${MODEL_LABELS[input.kind]} - ${input.periodLabel}`;
  workbook.subject = 'Relatório gerencial dinâmico';
  workbook.created = new Date();

  addExecutiveSheet(workbook.addWorksheet('Resumo Executivo', { properties: { tabColor: { argb: COLORS.gold } } }), input);
  addModelSheet(workbook.addWorksheet(MODEL_LABELS[input.kind], { properties: { tabColor: { argb: COLORS.navy } } }), input);
  addComparisonSheet(workbook.addWorksheet('Comparações', { properties: { tabColor: { argb: '2F6FB0' } } }), input);
  addInsightsSheet(workbook.addWorksheet('Insights', { properties: { tabColor: { argb: COLORS.green } } }), input);
  addBaseSheet(workbook.addWorksheet('Base de Ordens', { properties: { tabColor: { argb: COLORS.muted } } }), input.orders);
  return workbook;
}

export async function buildReportWorkbookBuffer(input: ReportWorkbookInput): Promise<Uint8Array> {
  const buffer = await buildReportWorkbook(input).xlsx.writeBuffer();
  return new Uint8Array(buffer);
}

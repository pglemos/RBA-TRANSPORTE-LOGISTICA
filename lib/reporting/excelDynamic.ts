
import ExcelJS from 'exceljs';

import { buildReportComparison } from './insights.ts';
import type { BreakdownItem, RankingItem, ReportAnalytics, ReportInsight, ReportKind, ReportingOrder, TimeSeriesPoint } from './types.ts';

const COLORS = { navy: '0B1730', gold: 'C5A866', goldSoft: 'F5EEDD', white: 'FFFFFF', text: '172033', muted: '667085', border: 'D8DEE8', stripe: 'F8FAFC', green: '17603A', greenSoft: 'EDF8F1', amberSoft: 'FFF7E6', blueSoft: 'EDF4FF', redSoft: 'FDECEC' } as const;
const CURRENCY_FORMAT = 'R$ #,##0.00;[Red]-R$ #,##0.00';
const PERCENT_FORMAT = '0.0%';
const MODEL_LABELS: Record<ReportKind, string> = { executive: 'Executivo', expenses: 'Despesas', profits: 'Lucros', clients: 'Clientes', drivers: 'Motoristas', routes: 'Rotas', recurrence: 'Recorrência', 'in-progress': 'Em Andamento' };
let tableSequence = 0;

export interface ReportWorkbookInput { kind: ReportKind; periodLabel: string; filtersLabel: string; orders: ReportingOrder[]; current: ReportAnalytics; previous: ReportAnalytics | null; previousYear: ReportAnalytics | null; insights: ReportInsight[]; generatedAt?: Date; }
interface TableOptions { freeze?: boolean; freezeColumns?: number; autoFilter?: boolean; currencyColumns?: number[]; percentColumns?: number[]; integerColumns?: number[]; dateColumns?: number[]; }
const fill = (color: string): ExcelJS.Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: color } });

function applyPageSetup(sheet: ExcelJS.Worksheet) {
  sheet.pageSetup = { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } };
}

function styleHeader(row: ExcelJS.Row) {
  row.height = 30;
  row.eachCell((cell) => { cell.fill = fill(COLORS.navy); cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: COLORS.white } }; cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; cell.border = { bottom: { style: 'medium', color: { argb: COLORS.gold } } }; });
}

function styleBody(sheet: ExcelJS.Worksheet, startRow: number, endRow: number) {
  for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    row.eachCell((cell) => { cell.font = { name: 'Arial', size: 9, color: { argb: COLORS.text } }; cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true }; cell.border = { bottom: { style: 'hair', color: { argb: COLORS.border } } }; if (rowNumber % 2 === 0) cell.fill = fill(COLORS.stripe); });
  }
}

function autoFit(sheet: ExcelJS.Worksheet, minimum = 10, maximum = 36) {
  sheet.columns.forEach((column) => { let width = minimum; column.eachCell?.({ includeEmpty: true }, (cell) => { const text = cell.value instanceof Date ? '00/00/0000' : String(cell.value ?? ''); width = Math.max(width, Math.min(maximum, Math.max(...text.split(/\r?\n/).map((line) => line.length)) + 2)); }); column.width = width; });
}

function addBrand(sheet: ExcelJS.Worksheet, title: string, input: ReportWorkbookInput, columns = 8) {
  sheet.mergeCells(1, 1, 1, columns); const brand = sheet.getCell(1, 1); brand.value = 'RBA TRANSPORTE & LOGÍSTICA'; brand.fill = fill(COLORS.navy); brand.font = { name: 'Arial', size: 16, bold: true, color: { argb: COLORS.white } }; brand.alignment = { vertical: 'middle', horizontal: 'left' }; sheet.getRow(1).height = 32;
  sheet.mergeCells(2, 1, 2, columns); const titleCell = sheet.getCell(2, 1); titleCell.value = title; titleCell.font = { name: 'Arial', size: 15, bold: true, color: { argb: COLORS.navy } }; titleCell.alignment = { wrapText: true }; sheet.getRow(2).height = 28;
  sheet.mergeCells(3, 1, 3, columns); sheet.getCell(3, 1).value = `Período: ${input.periodLabel}`; sheet.getCell(3, 1).font = { name: 'Arial', size: 10, bold: true, color: { argb: COLORS.gold } };
  sheet.mergeCells(4, 1, 4, columns); sheet.getCell(4, 1).value = `Filtros: ${input.filtersLabel} | Gerado em ${(input.generatedAt || new Date()).toLocaleString('pt-BR')} | Snapshot oficial: valores não são recalculados no Excel.`; sheet.getCell(4, 1).font = { name: 'Arial', size: 9, color: { argb: COLORS.muted } }; sheet.getCell(4, 1).alignment = { wrapText: true }; sheet.getRow(4).height = 32;
}

function addSection(sheet: ExcelJS.Worksheet, title: string, columns = 8) { sheet.addRow([]); const row = sheet.addRow([title]); sheet.mergeCells(row.number, 1, row.number, columns); row.height = 24; const cell = row.getCell(1); cell.fill = fill(COLORS.goldSoft); cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: COLORS.navy } }; cell.border = { left: { style: 'medium', color: { argb: COLORS.gold } } }; }

function addTable(sheet: ExcelJS.Worksheet, headers: string[], rows: Array<Array<string | number | Date>>, options: TableOptions = {}) {
  const headerRow = sheet.rowCount + 1;
  const name = `RBA_Table_${sheet.id}_${++tableSequence}`;
  sheet.addTable({ name, ref: `A${headerRow}`, headerRow: true, totalsRow: false, style: { theme: 'TableStyleMedium2', showRowStripes: true }, columns: headers.map((header) => ({ name: header })), rows });
  styleHeader(sheet.getRow(headerRow));
  const start = headerRow + 1; const end = headerRow + rows.length; styleBody(sheet, start, end);
  for (let row = start; row <= end; row += 1) {
    options.currencyColumns?.forEach((col) => { sheet.getCell(row, col).numFmt = CURRENCY_FORMAT; });
    options.percentColumns?.forEach((col) => { sheet.getCell(row, col).numFmt = PERCENT_FORMAT; });
    options.integerColumns?.forEach((col) => { sheet.getCell(row, col).numFmt = '0'; });
    options.dateColumns?.forEach((col) => { sheet.getCell(row, col).numFmt = 'dd/mm/yyyy'; });
  }
  if (options.freeze) sheet.views = [{ state: 'frozen', ySplit: headerRow, xSplit: options.freezeColumns || 0 }];
  if (options.autoFilter) sheet.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: headerRow, column: headers.length } };
  sheet.pageSetup.printTitlesRow = `${headerRow}:${headerRow}`;
  return { headerRow, start, end };
}

const rankingRows = (items: RankingItem[]) => items.map((item) => [item.label, item.orderCount, item.cteValue, item.averageCteValue, item.expenses, item.netValue, item.sharePercent / 100]);
function addRanking(sheet: ExcelJS.Worksheet, title: string, items: RankingItem[]) { addSection(sheet, title, 7); addTable(sheet, ['Nome', 'Operações', 'Valor CTE', 'Ticket médio', 'Despesas', 'Lucro líquido', 'Participação no CTE'], rankingRows(items), { integerColumns: [2], currencyColumns: [3, 4, 5, 6], percentColumns: [7] }); }
function addBreakdown(sheet: ExcelJS.Worksheet, title: string, items: BreakdownItem[], mode: 'currency' | 'count' = 'currency') { addSection(sheet, title, 4); addTable(sheet, ['Categoria', 'Valor', 'Operações', 'Participação'], items.map((item) => [item.label, mode === 'currency' ? item.value : item.orderCount, item.orderCount, item.sharePercent / 100]), { currencyColumns: mode === 'currency' ? [2] : [], integerColumns: mode === 'count' ? [2, 3] : [3], percentColumns: [4] }); }
function addTimeSeries(sheet: ExcelJS.Worksheet, title: string, points: TimeSeriesPoint[]) { addSection(sheet, title, 5); addTable(sheet, ['Semana', 'Operações', 'Valor CTE', 'Despesas', 'Lucro líquido'], points.map((point) => [point.label, point.orderCount, point.cteValue, point.expenses, point.netValue]), { integerColumns: [2], currencyColumns: [3, 4, 5] }); }

function addMetricGrid(sheet: ExcelJS.Worksheet, analytics: ReportAnalytics) {
  addSection(sheet, 'Indicadores do período', 8);
  const rows = [
    ['Operações', analytics.summary.totalOrders, 'Valor CTE', analytics.summary.totalCteValue, 'Dedução registrada', analytics.summary.totalRecordedDiscountValue, 'Receita líquida', analytics.summary.totalNetRevenue],
    ['Lucro líquido', analytics.summary.totalNetValue, 'Margem', analytics.summary.marginPercent / 100, 'Não classificado', analytics.summary.totalUnclassifiedPaymentValue, 'Cobertura de pagamentos', analytics.summary.paymentCoveragePercent / 100],
  ];
  rows.forEach((values, index) => { const row = sheet.addRow(values); row.height = 34; row.eachCell((cell, col) => { cell.fill = fill(col % 2 === 0 ? COLORS.goldSoft : COLORS.stripe); cell.font = col % 2 === 0 ? { name: 'Arial', size: 11, bold: true, color: { argb: COLORS.navy } } : { name: 'Arial', size: 8, bold: true, color: { argb: COLORS.muted } }; cell.alignment = { vertical: 'middle', horizontal: col % 2 === 0 ? 'right' : 'left', wrapText: true }; }); if (index === 0) { row.getCell(2).numFmt = '0'; [4, 6, 8].forEach((col) => { row.getCell(col).numFmt = CURRENCY_FORMAT; }); } else { [2, 6].forEach((col) => { row.getCell(col).numFmt = CURRENCY_FORMAT; }); [4, 8].forEach((col) => { row.getCell(col).numFmt = PERCENT_FORMAT; }); } });
}

function addExecutiveSheet(sheet: ExcelJS.Worksheet, input: ReportWorkbookInput) { addBrand(sheet, 'Resumo Executivo do Período', input); addMetricGrid(sheet, input.current); addRanking(sheet, 'Principais clientes', input.current.clients.slice(0, 10)); addRanking(sheet, 'Principais rotas', input.current.routes.slice(0, 10)); addTimeSeries(sheet, 'Evolução semanal', input.current.timeSeries); sheet.views = [{ state: 'frozen', ySplit: 4 }]; autoFit(sheet, 11, 34); applyPageSetup(sheet); }

function addModelSheet(sheet: ExcelJS.Worksheet, input: ReportWorkbookInput) {
  addBrand(sheet, `Relatório ${MODEL_LABELS[input.kind]}`, input); const limit = 30; const byExpense = (items: RankingItem[]) => [...items].sort((a, b) => b.expenses - a.expenses).slice(0, limit); const byProfit = (items: RankingItem[]) => [...items].sort((a, b) => b.netValue - a.netValue).slice(0, limit); const recurring = (items: RankingItem[]) => items.filter((item) => item.orderCount >= 2).slice(0, limit);
  if (input.kind === 'expenses') { addBreakdown(sheet, 'Composição das despesas', input.current.expenses); addRanking(sheet, 'Clientes com maior despesa', byExpense(input.current.clients)); addRanking(sheet, 'Motoristas com maior despesa', byExpense(input.current.drivers)); addRanking(sheet, 'Rotas com maior despesa', byExpense(input.current.routes)); addTimeSeries(sheet, 'Evolução semanal das despesas', input.current.timeSeries); }
  else if (input.kind === 'profits') { addBreakdown(sheet, 'Distribuição dos resultados registrados', input.current.profitBuckets); addRanking(sheet, 'Clientes com maior lucro', byProfit(input.current.clients)); addRanking(sheet, 'Motoristas com maior lucro', byProfit(input.current.drivers)); addRanking(sheet, 'Rotas com maior lucro', byProfit(input.current.routes)); addTimeSeries(sheet, 'Evolução semanal do lucro', input.current.timeSeries); }
  else if (input.kind === 'clients') { addMetricGrid(sheet, input.current); addRanking(sheet, 'Performance por cliente', input.current.clients.slice(0, limit)); addRanking(sheet, 'Clientes recorrentes', recurring(input.current.clients)); }
  else if (input.kind === 'drivers') { addMetricGrid(sheet, input.current); addRanking(sheet, 'Performance por motorista', input.current.drivers.slice(0, limit)); addRanking(sheet, 'Motoristas recorrentes', recurring(input.current.drivers)); }
  else if (input.kind === 'routes') { addRanking(sheet, 'Performance por rota', input.current.routes.slice(0, limit)); addRanking(sheet, 'Principais origens', input.current.origins.slice(0, limit)); addRanking(sheet, 'Principais destinos', input.current.destinations.slice(0, limit)); addTimeSeries(sheet, 'Evolução semanal', input.current.timeSeries); }
  else if (input.kind === 'recurrence') { addRanking(sheet, 'Clientes recorrentes', recurring(input.current.clients)); addRanking(sheet, 'Motoristas recorrentes', recurring(input.current.drivers)); addRanking(sheet, 'Rotas recorrentes', recurring(input.current.routes)); addRanking(sheet, 'Combinações cliente + rota', recurring(input.current.clientRoutes)); }
  else if (input.kind === 'in-progress') { addBreakdown(sheet, 'Operações abertas por status', input.current.inProgressSummary.byStatus, 'count'); addRanking(sheet, 'Clientes com operações abertas', input.current.inProgressSummary.byClient.slice(0, limit)); addRanking(sheet, 'Rotas com operações abertas', input.current.inProgressSummary.byRoute.slice(0, limit)); }
  sheet.views = [{ state: 'frozen', ySplit: 4 }]; autoFit(sheet, 11, 36); applyPageSetup(sheet);
}

function addComparisonSheet(sheet: ExcelJS.Worksheet, input: ReportWorkbookInput) {
  addBrand(sheet, 'Comparações Gerenciais', input, 7); const previous = input.previous ? buildReportComparison(input.current, input.previous) : null; const previousYear = input.previousYear ? buildReportComparison(input.current, input.previousYear) : null;
  const definitions: Array<[string, keyof ReturnType<typeof buildReportComparison>, 'currency' | 'integer' | 'points']> = [['Operações', 'totalOrders', 'integer'], ['Valor CTE', 'totalCteValue', 'currency'], ['Lucro líquido registrado', 'totalNetValue', 'currency'], ['Despesas registradas', 'totalExpenses', 'currency'], ['Margem gerencial', 'marginPercent', 'points'], ['Taxa de entrega', 'deliveredPercent', 'points']];
  const table = addTable(sheet, ['Indicador', 'Atual', 'Período anterior', 'Variação', 'Ano anterior', 'Variação anual', 'Unidade'], definitions.map(([label, key, type]) => { const currentRaw = input.current.summary[key as keyof typeof input.current.summary] as number; const p = previous?.[key]; const y = previousYear?.[key]; return [label, type === 'points' ? currentRaw / 100 : currentRaw, p ? (type === 'points' ? p.reference / 100 : p.reference) : 'Sem base', p ? (type === 'points' ? p.absoluteChange / 100 : (p.percentChange ?? 0) / 100) : 'Sem base', y ? (type === 'points' ? y.reference / 100 : y.reference) : 'Sem base', y ? (type === 'points' ? y.absoluteChange / 100 : (y.percentChange ?? 0) / 100) : 'Sem base', type === 'points' ? 'p.p.' : type === 'currency' ? 'R$' : 'quantidade']; }), { autoFilter: true });
  definitions.forEach(([, , type], index) => { const row = table.start + index; if (type === 'currency') [2, 3, 5].forEach((col) => { if (typeof sheet.getCell(row, col).value === 'number') sheet.getCell(row, col).numFmt = CURRENCY_FORMAT; }); else if (type === 'points') [2, 3, 4, 5, 6].forEach((col) => { if (typeof sheet.getCell(row, col).value === 'number') sheet.getCell(row, col).numFmt = PERCENT_FORMAT; }); else [2, 3, 5].forEach((col) => { if (typeof sheet.getCell(row, col).value === 'number') sheet.getCell(row, col).numFmt = '0'; }); if (type !== 'points') [4, 6].forEach((col) => { if (typeof sheet.getCell(row, col).value === 'number') sheet.getCell(row, col).numFmt = PERCENT_FORMAT; }); });
  sheet.views = [{ state: 'frozen', ySplit: table.headerRow }]; autoFit(sheet, 12, 32); applyPageSetup(sheet);
}

function addInsightsSheet(sheet: ExcelJS.Worksheet, input: ReportWorkbookInput) { addBrand(sheet, 'Insights e Prioridades', input, 5); const table = addTable(sheet, ['Classificação', 'Título', 'Descrição', 'Evidência', 'Prioridade'], input.insights.map((insight) => [insight.kind, insight.title, insight.description, insight.evidence, insight.priority]), { integerColumns: [5], freeze: true, autoFilter: true }); for (let row = table.start; row <= table.end; row += 1) { const kind = String(sheet.getCell(row, 1).value || ''); sheet.getCell(row, 1).fill = fill(kind === 'strength' || kind === 'highlight' ? COLORS.greenSoft : kind === 'priority' || kind === 'attention' ? COLORS.amberSoft : COLORS.blueSoft); } autoFit(sheet, 12, 52); applyPageSetup(sheet); }

function dateFromIso(value: string): Date | string { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value; const [year, month, day] = value.split('-').map(Number); return new Date(Date.UTC(year, month - 1, day)); }
function orderRows(orders: ReportingOrder[]) { return orders.map((order) => [order.orderNumber, order.cteNumber, dateFromIso(order.emissionDateValue), order.emissionDateValue, order.clientName, order.driverName, order.origin, order.destination, order.cteValue, order.cteDiscountPercent / 100, order.cteDiscountValue, order.netRevenue, order.freightValue, order.advanceValue, order.cashValue, order.balanceValue, order.classifiedPaymentValue, order.unclassifiedPaymentValue, order.loadingExpense, order.unloadingExpense, order.otherExpenses, order.totalExpenses, order.netValue, order.status]); }

function addBaseSheet(sheet: ExcelJS.Worksheet, input: ReportWorkbookInput) {
  addBrand(sheet, 'Base de Ordens - Snapshot Oficial', input, 24);
  const table = addTable(sheet, ['Ordem', 'Referências CTE / Manifesto', 'Data de emissão', 'Data ISO', 'Cliente', 'Motorista', 'Origem', 'Destino', 'Valor CTE', 'Desconto CTE', 'Dedução registrada', 'Receita líquida', 'Frete', 'Adiantamento', 'À vista', 'Saldo', 'Pagamento classificado', 'Pagamento não classificado', 'Carga', 'Descarga', 'Outros', 'Despesas totais', 'Lucro líquido', 'Status'], orderRows(input.orders), { dateColumns: [3], percentColumns: [10], currencyColumns: [9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23], freeze: true, freezeColumns: 2, autoFilter: true });
  for (let row = table.start; row <= table.end; row += 1) { const status = String(sheet.getCell(row, 24).value || ''); sheet.getCell(row, 24).fill = fill(status === 'Entregue' ? COLORS.greenSoft : status === 'Em Trânsito' ? COLORS.blueSoft : COLORS.amberSoft); if (Number(sheet.getCell(row, 18).value || 0) > 0) sheet.getCell(row, 18).fill = fill(COLORS.redSoft); }
  autoFit(sheet, 10, 30); [1, 2, 5, 6, 7, 8].forEach((col) => { sheet.getColumn(col).width = col === 7 || col === 8 ? 24 : 18; }); sheet.getColumn(3).width = 13; sheet.getColumn(4).width = 12; applyPageSetup(sheet);
}

function addDataQualitySheet(sheet: ExcelJS.Worksheet, input: ReportWorkbookInput) {
  addBrand(sheet, 'Validação e Qualidade dos Dados', input, 8); addMetricGrid(sheet, input.current); addSection(sheet, 'Ordens com pagamento não classificado', 8);
  const gaps = input.orders.filter((order) => order.unclassifiedPaymentValue > 0.009);
  addTable(sheet, ['Ordem', 'Referências', 'Data', 'Cliente', 'Frete', 'Classificado', 'Não classificado', 'Status'], gaps.map((order) => [order.orderNumber, order.cteNumber, dateFromIso(order.emissionDateValue), order.clientName, order.freightValue, order.classifiedPaymentValue, order.unclassifiedPaymentValue, order.status]), { dateColumns: [3], currencyColumns: [5, 6, 7], autoFilter: true });
  addSection(sheet, 'Regras de integridade', 8); sheet.addRow(['Filtro temporal', 'Somente data de emissão dentro do período', 'Dedução', 'Campo registrado pelo sistema', 'Pagamentos', 'Diferença explicitada', 'Snapshot', 'Sem recálculo financeiro por ordem']); autoFit(sheet, 12, 34); applyPageSetup(sheet);
}

export function buildReportWorkbook(input: ReportWorkbookInput): ExcelJS.Workbook {
  tableSequence = 0; const workbook = new ExcelJS.Workbook(); workbook.creator = 'RBA Transporte & Logística'; workbook.company = 'RBA Transporte & Logística'; workbook.title = `Relatório ${MODEL_LABELS[input.kind]} - ${input.periodLabel}`; workbook.subject = 'Relatório gerencial dinâmico'; const generatedAt = input.generatedAt || new Date(); workbook.created = generatedAt; workbook.modified = generatedAt;
  addExecutiveSheet(workbook.addWorksheet('Resumo Executivo', { properties: { tabColor: { argb: COLORS.gold } } }), input);
  if (input.kind !== 'executive') addModelSheet(workbook.addWorksheet(MODEL_LABELS[input.kind], { properties: { tabColor: { argb: COLORS.navy } } }), input);
  addComparisonSheet(workbook.addWorksheet('Comparações', { properties: { tabColor: { argb: '2F6FB0' } } }), input);
  addInsightsSheet(workbook.addWorksheet('Insights', { properties: { tabColor: { argb: COLORS.green } } }), input);
  addDataQualitySheet(workbook.addWorksheet('Qualidade dos Dados', { properties: { tabColor: { argb: 'B95F47' } } }), input);
  addBaseSheet(workbook.addWorksheet('Base de Ordens', { properties: { tabColor: { argb: COLORS.muted } } }), input);
  return workbook;
}

export async function buildReportWorkbookBuffer(input: ReportWorkbookInput): Promise<Uint8Array> { const buffer = await buildReportWorkbook(input).xlsx.writeBuffer(); return new Uint8Array(buffer); }

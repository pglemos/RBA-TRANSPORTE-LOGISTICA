import ExcelJS from 'exceljs';

import { buildReportComparison } from './insights.ts';
import type {
  RankingItem,
  ReportAnalytics,
  ReportInsight,
  ReportKind,
  ReportingOrder,
} from './types.ts';

const COLORS = {
  navy: '0B1730',
  navySoft: '16233D',
  gold: 'C5A866',
  goldSoft: 'F4EBDD',
  white: 'FFFFFF',
  text: '162033',
  muted: '667085',
  border: 'D7DEE8',
  green: '198754',
  greenSoft: 'E9F7EF',
  amber: 'B7791F',
  amberSoft: 'FFF7E6',
  red: 'B42318',
  redSoft: 'FDECEC',
  blue: '2F6FB0',
  blueSoft: 'EAF3FC',
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

function styleTitleCell(cell: ExcelJS.Cell, size = 18) {
  cell.font = { name: 'Arial', size, bold: true, color: { argb: COLORS.white } };
  cell.alignment = { vertical: 'middle', horizontal: 'left' };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navy } };
}

function styleSectionHeader(row: ExcelJS.Row) {
  row.height = 24;
  row.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: COLORS.white } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navySoft } };
    cell.border = { bottom: { style: 'thin', color: { argb: COLORS.gold } } };
  });
}

function styleTableHeader(row: ExcelJS.Row) {
  row.height = 28;
  row.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: COLORS.white } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navy } };
    cell.border = {
      top: { style: 'thin', color: { argb: COLORS.navy } },
      bottom: { style: 'thin', color: { argb: COLORS.gold } },
      left: { style: 'thin', color: { argb: COLORS.navySoft } },
      right: { style: 'thin', color: { argb: COLORS.navySoft } },
    };
  });
}

function styleBodyRows(sheet: ExcelJS.Worksheet, startRow: number, endRow: number) {
  for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    row.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 9, color: { argb: COLORS.text } };
      cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
      cell.border = {
        bottom: { style: 'hair', color: { argb: COLORS.border } },
      };
      if (rowNumber % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F7F9FC' } };
      }
    });
  }
}

function autoFitColumns(sheet: ExcelJS.Worksheet, minimum = 10, maximum = 42) {
  sheet.columns.forEach((column) => {
    let width = minimum;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const raw = cell.value;
      const value = raw === null || raw === undefined
        ? ''
        : typeof raw === 'object' && 'richText' in raw
          ? raw.richText.map((item) => item.text).join('')
          : String(raw);
      const longestLine = value.split(/\r?\n/).reduce((longest, line) => Math.max(longest, line.length), 0);
      width = Math.max(width, Math.min(maximum, longestLine + 2));
    });
    column.width = width;
  });
}

function addBrandHeader(sheet: ExcelJS.Worksheet, title: string, periodLabel: string, filtersLabel: string) {
  sheet.mergeCells('A1:H1');
  sheet.getCell('A1').value = 'RBA TRANSPORTE & LOGÍSTICA';
  styleTitleCell(sheet.getCell('A1'), 16);
  sheet.getRow(1).height = 30;

  sheet.mergeCells('A2:H2');
  sheet.getCell('A2').value = title;
  sheet.getCell('A2').font = { name: 'Arial', size: 15, bold: true, color: { argb: COLORS.navy } };
  sheet.getCell('A2').alignment = { vertical: 'middle', horizontal: 'left' };
  sheet.getRow(2).height = 28;

  sheet.mergeCells('A3:H3');
  sheet.getCell('A3').value = `Período: ${periodLabel}`;
  sheet.getCell('A3').font = { name: 'Arial', size: 10, bold: true, color: { argb: COLORS.gold } };

  sheet.mergeCells('A4:H4');
  sheet.getCell('A4').value = `Filtros: ${filtersLabel}`;
  sheet.getCell('A4').font = { name: 'Arial', size: 9, color: { argb: COLORS.muted } };
  sheet.getCell('A4').alignment = { wrapText: true };
  sheet.getRow(4).height = 28;
}

function addMetricGrid(sheet: ExcelJS.Worksheet, analytics: ReportAnalytics) {
  const metrics = [
    ['Operações', analytics.summary.totalOrders, 'integer'],
    ['Valor CTE', analytics.summary.totalCteValue, 'currency'],
    ['Frete registrado', analytics.summary.totalFreightValue, 'currency'],
    ['Despesas registradas', analytics.summary.totalExpenses, 'currency'],
    ['Lucro líquido registrado', analytics.summary.totalNetValue, 'currency'],
    ['Margem gerencial', analytics.summary.marginPercent / 100, 'percent'],
    ['Ticket médio', analytics.summary.averageCteValue, 'currency'],
    ['Operações entregues', analytics.summary.deliveredPercent / 100, 'percent'],
  ] as const;

  sheet.addRow([]);
  const header = sheet.addRow(['Indicador', 'Valor', 'Indicador', 'Valor', 'Indicador', 'Valor', 'Indicador', 'Valor']);
  styleSectionHeader(header);
  const row1 = sheet.addRow([
    metrics[0][0], metrics[0][1], metrics[1][0], metrics[1][1], metrics[2][0], metrics[2][1], metrics[3][0], metrics[3][1],
  ]);
  const row2 = sheet.addRow([
    metrics[4][0], metrics[4][1], metrics[5][0], metrics[5][1], metrics[6][0], metrics[6][1], metrics[7][0], metrics[7][1],
  ]);

  for (const row of [row1, row2]) {
    row.height = 34;
    row.eachCell((cell, columnNumber) => {
      cell.alignment = { vertical: 'middle', horizontal: columnNumber % 2 === 0 ? 'right' : 'left', wrapText: true };
      cell.font = columnNumber % 2 === 0
        ? { name: 'Arial', size: 11, bold: true, color: { argb: COLORS.navy } }
        : { name: 'Arial', size: 8, bold: true, color: { argb: COLORS.muted } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: columnNumber % 2 === 0 ? COLORS.goldSoft : 'F7F9FC' } };
      cell.border = { bottom: { style: 'thin', color: { argb: COLORS.border } } };
    });
  }

  row1.getCell(2).numFmt = '0';
  row1.getCell(4).numFmt = CURRENCY_FORMAT;
  row1.getCell(6).numFmt = CURRENCY_FORMAT;
  row1.getCell(8).numFmt = CURRENCY_FORMAT;
  row2.getCell(2).numFmt = CURRENCY_FORMAT;
  row2.getCell(4).numFmt = PERCENT_FORMAT;
  row2.getCell(6).numFmt = CURRENCY_FORMAT;
  row2.getCell(8).numFmt = PERCENT_FORMAT;
}

function addRankingTable(sheet: ExcelJS.Worksheet, title: string, items: RankingItem[]) {
  sheet.addRow([]);
  const section = sheet.addRow([title]);
  sheet.mergeCells(section.number, 1, section.number, 7);
  styleSectionHeader(section);
  const header = sheet.addRow(['Nome', 'Operações', 'Valor CTE', 'Lucro', 'Despesas', 'Ticket médio', 'Participação']);
  styleTableHeader(header);
  const start = header.number + 1;
  for (const item of items) {
    sheet.addRow([
      item.label,
      item.orderCount,
      item.cteValue,
      item.netValue,
      item.expenses,
      item.averageCteValue,
      item.sharePercent / 100,
    ]);
  }
  const end = sheet.lastRow?.number || start - 1;
  styleBodyRows(sheet, start, end);
  for (let row = start; row <= end; row += 1) {
    sheet.getCell(row, 2).numFmt = '0';
    for (const column of [3, 4, 5, 6]) sheet.getCell(row, column).numFmt = CURRENCY_FORMAT;
    sheet.getCell(row, 7).numFmt = PERCENT_FORMAT;
  }
}

function addModelSheet(sheet: ExcelJS.Worksheet, input: ReportWorkbookInput) {
  addBrandHeader(sheet, `Relatório de ${MODEL_LABELS[input.kind]}`, input.periodLabel, input.filtersLabel);
  let headerRowNumber: number | null = null;

  if (input.kind === 'expenses') {
    const header = sheet.addRow(['Categoria', 'Valor registrado', 'Operações com lançamento', 'Participação']);
    styleTableHeader(header);
    const start = header.number + 1;
    input.current.expenses.forEach((item) => sheet.addRow([item.label, item.value, item.orderCount, item.sharePercent / 100]));
    styleBodyRows(sheet, start, sheet.lastRow?.number || start - 1);
    for (let row = start; row <= (sheet.lastRow?.number || start - 1); row += 1) {
      sheet.getCell(row, 2).numFmt = CURRENCY_FORMAT;
      sheet.getCell(row, 4).numFmt = PERCENT_FORMAT;
    }
    addRankingTable(sheet, 'Clientes com maior despesa consolidada', [...input.current.clients].sort((a, b) => b.expenses - a.expenses).slice(0, 20));
  } else if (input.kind === 'clients') {
    addRankingTable(sheet, 'Performance por cliente', input.current.clients);
  } else if (input.kind === 'drivers') {
    addRankingTable(sheet, 'Performance por motorista', input.current.drivers);
  } else if (input.kind === 'routes') {
    addRankingTable(sheet, 'Performance por rota', input.current.routes);
    addRankingTable(sheet, 'Principais origens', input.current.origins.slice(0, 20));
    addRankingTable(sheet, 'Principais destinos', input.current.destinations.slice(0, 20));
  } else if (input.kind === 'recurrence') {
    addRankingTable(sheet, 'Clientes recorrentes', input.current.clients.filter((item) => item.orderCount >= 2));
    addRankingTable(sheet, 'Motoristas recorrentes', input.current.drivers.filter((item) => item.orderCount >= 2));
    addRankingTable(sheet, 'Rotas recorrentes', input.current.routes.filter((item) => item.orderCount >= 2));
  } else {
    const source = input.kind === 'in-progress' ? input.current.inProgress : input.orders;
    const header = sheet.addRow(['Ordem', 'CTE / Manifesto', 'Emissão', 'Cliente', 'Motorista', 'Origem', 'Destino', 'Valor CTE', 'Frete', 'Despesas', 'Lucro', 'Status']);
    styleTableHeader(header);
    headerRowNumber = header.number;
    const start = header.number + 1;
    source.forEach((order) => sheet.addRow([
      order.orderNumber,
      order.cteNumber,
      order.emissionDate,
      order.clientName,
      order.driverName,
      order.origin,
      order.destination,
      order.cteValue,
      order.freightValue,
      order.totalExpenses,
      order.netValue,
      order.status,
    ]));
    const end = sheet.lastRow?.number || start - 1;
    styleBodyRows(sheet, start, end);
    for (let row = start; row <= end; row += 1) {
      for (const column of [8, 9, 10, 11]) sheet.getCell(row, column).numFmt = CURRENCY_FORMAT;
    }
  }

  sheet.views = [{ state: 'frozen', ySplit: headerRowNumber || 4 }];
  if (headerRowNumber !== null) {
    sheet.autoFilter = {
      from: { row: headerRowNumber, column: 1 },
      to: { row: headerRowNumber, column: Math.max(1, sheet.columnCount) },
    };
  }
  autoFitColumns(sheet);
}

function addComparisonSheet(sheet: ExcelJS.Worksheet, input: ReportWorkbookInput) {
  addBrandHeader(sheet, 'Comparações Gerenciais', input.periodLabel, input.filtersLabel);
  const header = sheet.addRow(['Indicador', 'Atual', 'Período anterior', 'Variação', 'Ano anterior', 'Variação anual']);
  styleTableHeader(header);

  const previous = input.previous ? buildReportComparison(input.current, input.previous) : null;
  const previousYear = input.previousYear ? buildReportComparison(input.current, input.previousYear) : null;
  const rows: Array<[string, keyof ReturnType<typeof buildReportComparison>, 'currency' | 'integer' | 'percent']> = [
    ['Operações', 'totalOrders', 'integer'],
    ['Valor CTE', 'totalCteValue', 'currency'],
    ['Lucro líquido registrado', 'totalNetValue', 'currency'],
    ['Despesas registradas', 'totalExpenses', 'currency'],
    ['Margem gerencial', 'marginPercent', 'percent'],
    ['Operações entregues', 'deliveredPercent', 'percent'],
  ];

  const start = header.number + 1;
  for (const [label, key, format] of rows) {
    const currentValue = input.current.summary[key as keyof typeof input.current.summary] as number;
    const previousMetric = previous?.[key];
    const yearMetric = previousYear?.[key];
    sheet.addRow([
      label,
      format === 'percent' ? currentValue / 100 : currentValue,
      previousMetric ? (format === 'percent' ? previousMetric.reference / 100 : previousMetric.reference) : 'Sem base',
      previousMetric?.percentChange === null || previousMetric === undefined ? 'Sem base' : previousMetric.percentChange / 100,
      yearMetric ? (format === 'percent' ? yearMetric.reference / 100 : yearMetric.reference) : 'Sem base',
      yearMetric?.percentChange === null || yearMetric === undefined ? 'Sem base' : yearMetric.percentChange / 100,
    ]);
  }
  const end = sheet.lastRow?.number || start - 1;
  styleBodyRows(sheet, start, end);
  for (let row = start; row <= end; row += 1) {
    const format = rows[row - start][2];
    if (format === 'currency') {
      sheet.getCell(row, 2).numFmt = CURRENCY_FORMAT;
      if (typeof sheet.getCell(row, 3).value === 'number') sheet.getCell(row, 3).numFmt = CURRENCY_FORMAT;
      if (typeof sheet.getCell(row, 5).value === 'number') sheet.getCell(row, 5).numFmt = CURRENCY_FORMAT;
    } else if (format === 'percent') {
      sheet.getCell(row, 2).numFmt = PERCENT_FORMAT;
      if (typeof sheet.getCell(row, 3).value === 'number') sheet.getCell(row, 3).numFmt = PERCENT_FORMAT;
      if (typeof sheet.getCell(row, 5).value === 'number') sheet.getCell(row, 5).numFmt = PERCENT_FORMAT;
    }
    if (typeof sheet.getCell(row, 4).value === 'number') sheet.getCell(row, 4).numFmt = PERCENT_FORMAT;
    if (typeof sheet.getCell(row, 6).value === 'number') sheet.getCell(row, 6).numFmt = PERCENT_FORMAT;
  }
  sheet.views = [{ state: 'frozen', ySplit: 5 }];
  autoFitColumns(sheet, 14, 34);
}

function addInsightsSheet(sheet: ExcelJS.Worksheet, input: ReportWorkbookInput) {
  addBrandHeader(sheet, 'Insights e Prioridades', input.periodLabel, input.filtersLabel);
  const header = sheet.addRow(['Classificação', 'Título', 'Descrição', 'Evidência', 'Prioridade']);
  styleTableHeader(header);
  const start = header.number + 1;
  input.insights.forEach((insight) => sheet.addRow([
    insight.kind,
    insight.title,
    insight.description,
    insight.evidence,
    insight.priority,
  ]));
  const end = sheet.lastRow?.number || start - 1;
  styleBodyRows(sheet, start, end);
  for (let row = start; row <= end; row += 1) {
    const kind = String(sheet.getCell(row, 1).value || '');
    const color = kind === 'strength' || kind === 'highlight'
      ? COLORS.greenSoft
      : kind === 'attention' || kind === 'priority'
        ? COLORS.amberSoft
        : COLORS.blueSoft;
    sheet.getCell(row, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
    sheet.getCell(row, 1).font = { name: 'Arial', size: 9, bold: true, color: { argb: COLORS.navy } };
  }
  sheet.views = [{ state: 'frozen', ySplit: 5 }];
  autoFitColumns(sheet, 12, 58);
}

function addBaseSheet(sheet: ExcelJS.Worksheet, orders: ReportingOrder[]) {
  const header = sheet.addRow([
    'Ordem', 'CTE / Manifesto', 'Emissão', 'Cliente', 'Motorista', 'Origem', 'Destino', 'Valor CTE', 'Frete',
    'Adiantamento', 'À vista', 'Saldo', 'Carga', 'Descarga', 'Outros', 'Despesas totais', 'Lucro líquido', 'Status',
  ]);
  styleTableHeader(header);
  const start = 2;
  for (const order of orders) {
    sheet.addRow([
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
  const end = sheet.lastRow?.number || 1;
  styleBodyRows(sheet, start, end);
  for (let row = start; row <= end; row += 1) {
    for (let column = 8; column <= 17; column += 1) sheet.getCell(row, column).numFmt = CURRENCY_FORMAT;
  }
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = { from: 'A1', to: `R${Math.max(1, end)}` };
  autoFitColumns(sheet, 11, 38);
}

export function buildReportWorkbook(input: ReportWorkbookInput): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'RBA Transporte & Logística';
  workbook.company = 'RBA Transporte & Logística';
  workbook.title = `Relatório de ${MODEL_LABELS[input.kind]} - ${input.periodLabel}`;
  workbook.subject = 'Relatório gerencial dinâmico';
  workbook.created = new Date();

  const executive = workbook.addWorksheet('Resumo Executivo', { properties: { tabColor: { argb: COLORS.gold } } });
  addBrandHeader(executive, 'Resumo Executivo do Período', input.periodLabel, input.filtersLabel);
  addMetricGrid(executive, input.current);
  addRankingTable(executive, 'Principais clientes', input.current.clients.slice(0, 10));
  addRankingTable(executive, 'Principais rotas', input.current.routes.slice(0, 10));
  executive.views = [{ state: 'frozen', ySplit: 5 }];
  autoFitColumns(executive, 13, 36);

  addModelSheet(workbook.addWorksheet(MODEL_LABELS[input.kind], { properties: { tabColor: { argb: COLORS.navy } } }), input);
  addComparisonSheet(workbook.addWorksheet('Comparações', { properties: { tabColor: { argb: COLORS.blue } } }), input);
  addInsightsSheet(workbook.addWorksheet('Insights', { properties: { tabColor: { argb: COLORS.green } } }), input);
  addBaseSheet(workbook.addWorksheet('Base de Ordens', { properties: { tabColor: { argb: COLORS.muted } } }), input.orders);

  return workbook;
}

export async function buildReportWorkbookBuffer(input: ReportWorkbookInput): Promise<Uint8Array> {
  const buffer = await buildReportWorkbook(input).xlsx.writeBuffer();
  return new Uint8Array(buffer);
}

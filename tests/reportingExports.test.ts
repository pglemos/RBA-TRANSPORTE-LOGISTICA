import test from 'node:test';
import assert from 'node:assert/strict';

import { buildReportAnalytics } from '../lib/reporting/analytics.ts';
import { buildReportInsights } from '../lib/reporting/insights.ts';
import { serializeReportModelCsv } from '../lib/reporting/csv.ts';
import { buildReportWorkbook } from '../lib/reporting/excel.ts';
import type { ReportingOrder } from '../lib/reporting/types.ts';

const orders: ReportingOrder[] = [
  {
    id: '1', orderNumber: 'RBA-1', cteNumber: 'CTE-1', emissionDate: '01/07/2026', emissionDateValue: '2026-07-01',
    clientId: 'c1', clientName: 'Cliente; Alfa', driverId: 'd1', driverName: '=Motorista Um',
    origin: 'Betim - MG', destination: 'São Paulo - SP', status: 'Entregue',
    cteValue: 10000, freightValue: 6000, advanceValue: 2000, cashValue: 1000, balanceValue: 3000,
    loadingExpense: 100, unloadingExpense: 200, otherExpenses: 50, totalExpenses: 350, netValue: 3650,
  },
  {
    id: '2', orderNumber: 'RBA-2', cteNumber: 'CTE-2', emissionDate: '05/07/2026', emissionDateValue: '2026-07-05',
    clientId: 'c2', clientName: 'Cliente Beta', driverId: 'd2', driverName: 'Motorista Dois',
    origin: 'Betim - MG', destination: 'Rio de Janeiro - RJ', status: 'Em Trânsito',
    cteValue: 8000, freightValue: 5000, advanceValue: 1000, cashValue: 0, balanceValue: 4000,
    loadingExpense: 80, unloadingExpense: 120, otherExpenses: 0, totalExpenses: 200, netValue: 2800,
  },
];

const current = buildReportAnalytics(orders);
const insights = buildReportInsights(current, null, null);

test('creates a detailed CSV with BOM, CRLF and spreadsheet formula protection', () => {
  const csv = serializeReportModelCsv('executive', orders, current);

  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('\r\n'));
  assert.ok(csv.includes("'=Motorista Um"));
  assert.ok(csv.includes('"Cliente; Alfa"'));
});

test('creates model-specific CSV columns for expenses and clients', () => {
  const expensesCsv = serializeReportModelCsv('expenses', orders, current);
  const clientsCsv = serializeReportModelCsv('clients', orders, current);

  assert.ok(expensesCsv.includes('Categoria de Despesa'));
  assert.ok(expensesCsv.includes('Participação (%)'));
  assert.ok(clientsCsv.includes('Cliente'));
  assert.ok(clientsCsv.includes('Valor CTE (R$)'));
});

test('creates an Excel workbook with executive, comparison, insight and order sheets', () => {
  const workbook = buildReportWorkbook({
    kind: 'executive',
    periodLabel: 'Julho de 2026',
    filtersLabel: 'Todos os clientes | Todos os status',
    orders,
    current,
    previous: null,
    previousYear: null,
    insights,
  });

  assert.deepEqual(workbook.worksheets.map((sheet) => sheet.name), [
    'Resumo Executivo',
    'Comparações',
    'Insights',
    'Qualidade dos Dados',
    'Base de Ordens',
  ]);
  assert.equal(workbook.getWorksheet('Base de Ordens')?.views[0]?.state, 'frozen');
  assert.equal(workbook.getWorksheet('Resumo Executivo')?.getCell('A1').value, 'RBA TRANSPORTE & LOGÍSTICA');
});

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildReportFileName,
  buildReportRows,
  buildReportSummary,
  neutralizeSpreadsheetFormula,
  serializeReportCsv,
} from '../lib/reportExport.ts';

const normalizeStatus = (value: unknown) => String(value || 'Contratar');
const formatEmissionDate = (order: Record<string, unknown>) => String(order.formatted_emission_date || 'N/A');

function parseSemicolonCsv(csv: string): string[][] {
  const source = csv.charCodeAt(0) === 0xfeff ? csv.slice(1) : csv;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (quoted) {
      if (character === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') {
      quoted = true;
    } else if (character === ';') {
      row.push(field);
      field = '';
    } else if (character === '\r' && next === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      index += 1;
    } else {
      field += character;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

test('copies financial fields returned by the API without recalculation', () => {
  const [row] = buildReportRows(
    [{
      id: '1',
      order_number: 'RBA-2026-0001',
      cte_value: 10000,
      freight_value: 7000,
      advance_value: 3000,
      cash_value: 500,
      balance_value: 999,
      loading_expense: 100,
      unloading_expense: 200,
      other_expenses: 50,
      total_expenses: 321,
      net_value: 1234,
      status: 'Entregue',
      formatted_emission_date: '29/07/2026',
    }],
    { normalizeStatus, formatEmissionDate },
  );

  assert.equal(row.cteValue, 10000);
  assert.equal(row.freightValue, 7000);
  assert.equal(row.advanceValue, 3000);
  assert.equal(row.cashValue, 500);
  assert.equal(row.balanceValue, 999);
  assert.equal(row.loadingExpense, 100);
  assert.equal(row.unloadingExpense, 200);
  assert.equal(row.otherExpenses, 50);
  assert.equal(row.totalExpenses, 321);
  assert.equal(row.netValue, 1234);
});

test('aggregates only the values already present in mapped rows', () => {
  const rows = buildReportRows(
    [
      {
        id: '1',
        cte_value: 100,
        freight_value: 40,
        advance_value: 10,
        cash_value: 5,
        balance_value: 7,
        total_expenses: 3,
        net_value: 91,
        status: 'Entregue',
      },
      {
        id: '2',
        cte_value: 300,
        freight_value: 80,
        advance_value: 20,
        cash_value: 6,
        balance_value: 9,
        total_expenses: 4,
        net_value: 216,
        status: 'Em Trânsito',
      },
    ],
    { normalizeStatus, formatEmissionDate },
  );

  const summary = buildReportSummary(rows);

  assert.equal(summary.totalOrders, 2);
  assert.equal(summary.totalCteValue, 400);
  assert.equal(summary.totalFreightValue, 120);
  assert.equal(summary.totalAdvanceValue, 30);
  assert.equal(summary.totalCashValue, 11);
  assert.equal(summary.totalBalanceValue, 16);
  assert.equal(summary.totalExpenses, 7);
  assert.equal(summary.totalNetValue, 307);
  assert.equal(summary.averageCteValue, 200);
  assert.equal(summary.deliveredCount, 1);
  assert.equal(summary.inTransitCount, 1);
});

test('neutralizes spreadsheet formula prefixes without altering ordinary text', () => {
  assert.equal(neutralizeSpreadsheetFormula('=1+1'), "'=1+1");
  assert.equal(neutralizeSpreadsheetFormula('+cmd'), "'+cmd");
  assert.equal(neutralizeSpreadsheetFormula('-10'), "'-10");
  assert.equal(neutralizeSpreadsheetFormula('@SUM(A1:A2)'), "'@SUM(A1:A2)");
  assert.equal(neutralizeSpreadsheetFormula('RBA-2026-0001'), 'RBA-2026-0001');
  assert.equal(neutralizeSpreadsheetFormula('  =1+1'), "'  =1+1");
});

test('serializes UTF-8 BOM, CRLF, quoted text and stable columns', () => {
  const rows = buildReportRows(
    [{
      id: '1',
      order_number: '001',
      cte_number: '=HYPERLINK("bad")',
      driver_name: 'Motorista; Teste',
      origin: 'Betim - MG',
      destination: 'São Paulo - SP',
      client_name: 'Cliente "Premium"',
      cte_value: 1234.5,
      status: 'Entregue',
      formatted_emission_date: '29/07/2026',
    }],
    { normalizeStatus, formatEmissionDate },
  );

  const csv = serializeReportCsv(rows);
  const parsed = parseSemicolonCsv(csv);

  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.match(csv, /\r\n/);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].length, 21);
  assert.equal(parsed[1].length, parsed[0].length);
  assert.equal(parsed[1][1], "'=HYPERLINK(\"bad\")");
  assert.equal(parsed[1][3], 'Motorista; Teste');
  assert.equal(parsed[1][9], 'Cliente "Premium"');
  assert.equal(parsed[1][10], '1234,50');
});

test('exports header only for an empty result', () => {
  const parsed = parseSemicolonCsv(serializeReportCsv([]));
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].length, 21);
});

test('creates deterministic report file names', () => {
  const date = new Date('2026-07-29T18:30:00-03:00');
  assert.equal(buildReportFileName('csv', date), 'relatorio-executivo-rba-2026-07-29.csv');
  assert.equal(buildReportFileName('pdf', date), 'relatorio-executivo-rba-2026-07-29.pdf');
});
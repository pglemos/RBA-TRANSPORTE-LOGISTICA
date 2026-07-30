import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('premium print CSS defines fixed physical A4 pages and explicit page breaks', () => {
  const css = [
    read('app/relatorios/reporting-print-1.css'),
    read('app/relatorios/reporting-print-2.css'),
    read('app/relatorios/reporting-print-3.css'),
  ].join('\n');

  assert.match(css, /size:\s*a4 landscape/i);
  assert.match(css, /\.rba-print-page\s*\{/);
  assert.match(css, /width:\s*297mm/);
  assert.match(css, /height:\s*210mm/);
  assert.match(css, /break-after:\s*page/);
  assert.match(css, /\.rba-cover-page\s*\{/);
  assert.match(css, /\.rba-appendix-table\s*\{/);
  assert.doesNotMatch(css, /page-break-(after|inside)/);
  assert.match(css, /nth-child\(n\+6\):nth-child\(-n\+12\).*width:\s*5\.5%/s);
});

test('print document orchestrates premium pages instead of the old continuous report', () => {
  const source = read('components/reports/ReportPrintDocument.tsx');

  assert.match(source, /ExecutivePrintPages/);
  assert.match(source, /ModelPrintPages/);
  assert.match(source, /AppendixPages/);
  assert.match(source, /buildPrintPagePlan/);
  assert.match(source, /selectAppendixOrders/);
  assert.match(source, /plan\.filter\(\(page\) => page\.type !== 'appendix'\)\.length/);
  assert.doesNotMatch(source, /dynamic-report-summary/);
  assert.doesNotMatch(source, /<ModelSections/);
});

test('appendix reuses the planner page-size constant and shared order selector', () => {
  const source = read('components/reports/print/AppendixPages.tsx');
  assert.match(source, /APPENDIX_ROWS_PER_PAGE/);
  assert.match(source, /selectAppendixOrders\(report\)/);
  assert.match(source, /chunkForPrint\(source\)/);
  assert.match(source, /index \* APPENDIX_ROWS_PER_PAGE \+ 1/);
});

test('compact currency and trend chart handle negative values safely', () => {
  const source = read('components/reports/print/PrintPrimitives.tsx');
  assert.match(source, /const sign = value < 0 \? '-' : ''/);
  assert.match(source, /const scaleMin = Math\.min\(0, \.\.\.chartValues\)/);
  assert.match(source, /getter\(point\) - scaleMin/);
});

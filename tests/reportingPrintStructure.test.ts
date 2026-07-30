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
});

test('print document orchestrates premium pages instead of the old continuous report', () => {
  const source = read('components/reports/ReportPrintDocument.tsx');

  assert.match(source, /ExecutivePrintPages/);
  assert.match(source, /ModelPrintPages/);
  assert.match(source, /AppendixPages/);
  assert.match(source, /buildPrintPagePlan/);
  assert.doesNotMatch(source, /dynamic-report-summary/);
  assert.doesNotMatch(source, /<ModelSections/);
});

test('appendix uses the same twenty-row page size defined by the planner', () => {
  const source = read('components/reports/print/AppendixPages.tsx');
  assert.match(source, /chunkForPrint\(source\)/);
  assert.match(source, /index \* 20 \+ 1/);
});

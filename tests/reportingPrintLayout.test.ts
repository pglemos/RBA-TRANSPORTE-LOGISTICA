import test from 'node:test';
import assert from 'node:assert/strict';

import { APPENDIX_ROWS_PER_PAGE, buildPrintPagePlan, chunkForPrint } from '../lib/reporting/printLayout.ts';

test('executive report with 119 orders reproduces the 16-page premium structure', () => {
  const plan = buildPrintPagePlan('executive', 119, true);
  assert.equal(APPENDIX_ROWS_PER_PAGE, 20);
  assert.equal(plan.length, 16);
  assert.equal(plan.filter((page) => page.type === 'appendix').length, 6);
  assert.equal(plan[0].key, 'cover');
  assert.equal(plan[9].key, 'governance');
});

test('executive report with 85 orders creates 10 executive pages plus 5 appendix pages', () => {
  const plan = buildPrintPagePlan('executive', 85, true);
  assert.equal(plan.length, 15);
  assert.deepEqual(plan.at(-1), {
    key: 'appendix-5',
    type: 'appendix',
    title: 'Apêndice operacional',
    pageIndex: 4,
    startIndex: 80,
    endIndex: 85,
  });
});

test('executive report without details keeps only the ten board pages', () => {
  const plan = buildPrintPagePlan('executive', 119, false);
  assert.equal(plan.length, 10);
  assert.equal(plan.some((page) => page.type === 'appendix'), false);
});

test('in-progress report always includes its operational appendix', () => {
  const plan = buildPrintPagePlan('in-progress', 21, false);
  assert.equal(plan.filter((page) => page.type === 'appendix').length, 2);
});

test('every report model contains cover, insights and governance pages', () => {
  const kinds = ['executive', 'expenses', 'profits', 'clients', 'drivers', 'routes', 'recurrence', 'in-progress'] as const;
  for (const kind of kinds) {
    const keys = buildPrintPagePlan(kind, 0, false).map((page) => page.key);
    assert.equal(keys[0], 'cover');
    assert.ok(keys.includes('insights'));
    assert.ok(keys.includes('governance'));
  }
});

test('chunkForPrint never creates an empty trailing page', () => {
  assert.deepEqual(chunkForPrint([], 20), []);
  assert.deepEqual(chunkForPrint([1, 2, 3], 2), [[1, 2], [3]]);
  assert.deepEqual(chunkForPrint([1, 2, 3, 4], 2), [[1, 2], [3, 4]]);
  assert.throws(() => chunkForPrint([1], 0), /maior que zero/);
});

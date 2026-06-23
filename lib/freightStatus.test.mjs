import test from 'node:test';
import assert from 'node:assert/strict';
import { getFreightStatusListSortRank } from './freightStatus.ts';

test('freight status list order prioritizes active yard workflow', () => {
  const statuses = ['Entregue', 'Contratar', 'Em Trânsito', 'Carregando'];

  const sorted = statuses.toSorted(
    (a, b) => getFreightStatusListSortRank(a) - getFreightStatusListSortRank(b),
  );

  assert.deepEqual(sorted, ['Carregando', 'Em Trânsito', 'Entregue', 'Contratar']);
});

test('legacy Em Viagem status sorts as Em Transito', () => {
  assert.equal(getFreightStatusListSortRank('Em Viagem'), getFreightStatusListSortRank('Em Trânsito'));
});

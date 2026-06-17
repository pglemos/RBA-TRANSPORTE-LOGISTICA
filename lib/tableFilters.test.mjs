import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getUniqueFilterOptions,
  matchesAllFilters,
  matchesSearchFields,
} from './tableFilters.ts';

const rows = [
  {
    name: 'SERGIO FABRE',
    status: 'Ativo',
    bank_name: 'Banco Alfa',
    city: 'Araucaria',
  },
  {
    name: 'ANDERSON LUCIO',
    status: 'Bloqueado',
    bank_name: 'Banco Beta',
    city: 'Diadema',
  },
  {
    name: 'FIRE TRANSPORTES',
    status: 'Ativo',
    bank_name: 'Banco Alfa',
    city: 'Sao Paulo',
  },
];

test('matchesSearchFields filters by any configured text field', () => {
  const result = rows.filter((row) =>
    matchesSearchFields(row, 'lucio', ['name', 'city']),
  );

  assert.deepEqual(result.map((row) => row.name), ['ANDERSON LUCIO']);
});

test('matchesAllFilters requires every active select filter to match', () => {
  const result = rows.filter((row) =>
    matchesAllFilters(row, [
      { value: 'Ativo', getValue: (item) => item.status },
      { value: 'Banco Alfa', getValue: (item) => item.bank_name },
    ]),
  );

  assert.deepEqual(result.map((row) => row.name), ['SERGIO FABRE', 'FIRE TRANSPORTES']);
});

test('getUniqueFilterOptions returns sorted non-empty options', () => {
  assert.deepEqual(
    getUniqueFilterOptions(rows, (row) => row.bank_name),
    ['Banco Alfa', 'Banco Beta'],
  );
});

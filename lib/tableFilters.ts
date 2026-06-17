type FilterDefinition<T> = {
  value: string;
  getValue: (item: T) => unknown;
};

const normalizeFilterValue = (value: unknown) =>
  String(value ?? '').trim().toLocaleLowerCase('pt-BR');

export const matchesSearchFields = <T extends Record<string, unknown>>(
  item: T,
  search: string,
  fields: Array<keyof T>,
) => {
  const normalizedSearch = normalizeFilterValue(search);
  if (!normalizedSearch) return true;

  return fields.some((field) =>
    normalizeFilterValue(item?.[field]).includes(normalizedSearch),
  );
};

export const matchesAllFilters = <T>(item: T, filters: Array<FilterDefinition<T>>) =>
  filters.every(({ value, getValue }) => {
    const normalizedValue = normalizeFilterValue(value);
    if (!normalizedValue) return true;

    return normalizeFilterValue(getValue(item)) === normalizedValue;
  });

export const getUniqueFilterOptions = <T>(items: T[], getValue: (item: T) => unknown) =>
  Array.from(
    new Set(
      items
        .map((item) => String(getValue(item) ?? '').trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

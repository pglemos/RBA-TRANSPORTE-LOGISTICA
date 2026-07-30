import type { DateRange } from './types.ts';

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

function parseDateOnly(value: string): Date {
  if (!DATE_ONLY_PATTERN.test(value)) throw new Error(`Data inválida: ${value}`);
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    throw new Error(`Data inválida: ${value}`);
  }
  return date;
}

function formatDateOnly(date: Date): string {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

function addDays(value: string, days: number): string {
  const date = parseDateOnly(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateOnly(date);
}

function daysInRange(range: Pick<DateRange, 'startDate' | 'endDate'>): number {
  const start = parseDateOnly(range.startDate).getTime();
  const end = parseDateOnly(range.endDate).getTime();
  if (start > end) throw new Error('A data inicial não pode ser posterior à data final.');
  return Math.floor((end - start) / DAY_MS) + 1;
}

function shiftToPreviousYear(value: string): string {
  const date = parseDateOnly(value);
  const targetYear = date.getUTCFullYear() - 1;
  const targetMonth = date.getUTCMonth();
  const targetDay = date.getUTCDate();
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  return formatDateOnly(new Date(Date.UTC(targetYear, targetMonth, Math.min(targetDay, lastDay))));
}

export function getMonthRange(year: number, month: number): DateRange {
  if (!Number.isInteger(year) || year < 2000 || year > 9999) throw new Error('Ano inválido.');
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new Error('Mês inválido.');

  const endDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    startDate: `${year}-${String(month).padStart(2, '0')}-01`,
    endDate: `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`,
    label: `${MONTHS[month - 1]} de ${year}`,
  };
}

export function getYearRange(year: number): DateRange {
  if (!Number.isInteger(year) || year < 2000 || year > 9999) throw new Error('Ano inválido.');
  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
    label: `Ano de ${year}`,
  };
}

export function getCurrentMonthRange(date = new Date()): DateRange {
  return getMonthRange(date.getFullYear(), date.getMonth() + 1);
}

export function getCustomRange(startDate: string, endDate: string, label = 'Período personalizado'): DateRange {
  const range = { startDate, endDate, label };
  daysInRange(range);
  return range;
}

export function getPreviousEquivalentRange(range: DateRange): DateRange {
  const length = daysInRange(range);
  const endDate = addDays(range.startDate, -1);
  const startDate = addDays(endDate, -(length - 1));
  return {
    startDate,
    endDate,
    label: 'Período anterior equivalente',
  };
}

export function getPreviousYearRange(range: DateRange): DateRange {
  const startDate = shiftToPreviousYear(range.startDate);
  const endDate = shiftToPreviousYear(range.endDate);
  return {
    startDate,
    endDate,
    label: `Mesmo período de ${parseDateOnly(startDate).getUTCFullYear()}`,
  };
}

export function formatRangeLabel(range: Pick<DateRange, 'startDate' | 'endDate'>): string {
  const format = (value: string) => {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  };
  return `${format(range.startDate)} a ${format(range.endDate)}`;
}
